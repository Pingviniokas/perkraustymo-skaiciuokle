import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Order, Expense, Employee, AppState, AppContextType, PaymentMethod, ServiceType, SalaryPayout } from '../types';
import { INITIAL_EMPLOYEES, DEFAULT_MOVER_SALARY_RATE } from '../constants';
import { calculateEmployeeCostForOrder } from '../utils/calculations';
import { 
  getAllData, 
  ordersService, 
  expensesService, 
  employeesService, 
  salaryPayoutsService 
} from '../utils/firebaseService';

// TODO: Pakeiskite šį URL į savo realų backend API adresą
const API_BASE_URL = '/api'; // Pvz., 'https://jusu-projektas-id.a.run.app/api'
const AUTH_CODE = "199011"; // Naudosime tą patį kodą, kurį tikrins backend'as
const USE_FIREBASE = true; // Use Firebase Firestore for data storage
const USE_LOCAL_STORAGE = false; // Fallback to localStorage if Firebase fails

const defaultState: AppState = {
  orders: [],
  expenses: [],
  employees: INITIAL_EMPLOYEES, // Pradiniai darbuotojai gali likti, kol neįdiegtas jų valdymas serveryje
  salaryPayouts: [],
};

interface ApiError {
  message: string;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [appState, setAppState] = useState<AppState>(defaultState);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(new Date());

  // Helper function to save data to local storage
  const saveToLocalStorage = useCallback((state: AppState) => {
    if (USE_LOCAL_STORAGE) {
      try {
        localStorage.setItem('movingAppData', JSON.stringify(state));
      } catch (e) {
        console.error('Failed to save to local storage:', e);
      }
    }
  }, []);

  // Funkcija API užklausoms
  const fetchApi = useCallback(async (endpoint: string, options: RequestInit = {}) => {
    const headers = {
      'Content-Type': 'application/json',
      'X-Auth-Code': AUTH_CODE,
      ...options.headers,
    };
    const response = await fetch(`${API_BASE_URL}${endpoint}`, { ...options, headers });
    if (!response.ok) {
      const errorData: ApiError | { error: string } = await response.json().catch(() => ({ message: 'Unknown server error' }));
      const errorMessage = 'message' in errorData ? errorData.message : ('error' in errorData ? errorData.error : `Server error: ${response.status}`);
      throw new Error(errorMessage);
    }
    if (response.status === 204) { // No Content
        return null;
    }
    return response.json();
  }, []);

  // Pradinis duomenų užkrovimas
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        if (USE_FIREBASE) {
          // Load from Firebase Firestore
          const firebaseData = await getAllData();
          const loadedState: AppState = {
            orders: firebaseData.orders.map((ord: Order) => ({
              ...ord,
              applyWeekdayOvertime: ord.applyWeekdayOvertime === undefined ? false : ord.applyWeekdayOvertime,
              serviceType: ord.serviceType || ServiceType.MOVING, 
              extraKilometers: ord.extraKilometers || 0,
            })),
            expenses: firebaseData.expenses || [],
            employees: firebaseData.employees.length > 0 
              ? firebaseData.employees.map((emp: Employee) => ({
                  ...emp,
                  name: emp.name || `Darbuotojas ${emp.id}`,
                  hourlyRate: emp.hourlyRate || DEFAULT_MOVER_SALARY_RATE
                }))
              : INITIAL_EMPLOYEES, // Use initial employees if none in Firebase
            salaryPayouts: firebaseData.salaryPayouts || [],
          };
          setAppState(loadedState);
        } else if (USE_LOCAL_STORAGE) {
          // Fallback to local storage
          const savedData = localStorage.getItem('movingAppData');
          if (savedData) {
            const parsedData = JSON.parse(savedData);
            const loadedState: AppState = {
              orders: parsedData.orders || [],
              expenses: parsedData.expenses || [],
              employees: (parsedData.employees || INITIAL_EMPLOYEES).map((emp: Employee) => ({
                ...emp,
                name: emp.name || `Darbuotojas ${emp.id}`,
                hourlyRate: emp.hourlyRate || DEFAULT_MOVER_SALARY_RATE
              })),
              salaryPayouts: parsedData.salaryPayouts || [],
            };
            loadedState.orders = loadedState.orders.map((ord: Order) => ({
              ...ord,
              applyWeekdayOvertime: ord.applyWeekdayOvertime === undefined ? false : ord.applyWeekdayOvertime,
              serviceType: ord.serviceType || ServiceType.MOVING, 
              extraKilometers: ord.extraKilometers || 0,
            }));
            setAppState(loadedState);
          } else {
            setAppState(defaultState);
          }
        } else {
          // Original API call code
          const data = await fetchApi('/data');
          const loadedState: AppState = {
              orders: data.orders || [],
              expenses: data.expenses || [],
              employees: (data.employees || INITIAL_EMPLOYEES).map((emp: Employee) => ({
                   ...emp,
                  name: emp.name || `Darbuotojas ${emp.id}`,
                  hourlyRate: emp.hourlyRate || DEFAULT_MOVER_SALARY_RATE
              })),
              salaryPayouts: data.salaryPayouts || [],
          };
          loadedState.orders = loadedState.orders.map((ord: Order) => ({
              ...ord,
              applyWeekdayOvertime: ord.applyWeekdayOvertime === undefined ? false : ord.applyWeekdayOvertime,
              serviceType: ord.serviceType || ServiceType.MOVING, 
              extraKilometers: ord.extraKilometers || 0,
          }));
          setAppState(loadedState);
        }
      } catch (e: any) {
        console.error("Failed to load data:", e);
        setError(e.message || 'Nepavyko užkrauti duomenų.');
        // Fallback to default state with initial employees
        setAppState(defaultState);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [fetchApi]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setNow(new Date());
    }, 10000); 
    return () => clearInterval(intervalId);
  }, []);

  // ----- Orders -----
  const addOrder = useCallback(async (newOrderData: Omit<Order, 'id' | 'orderNumber' | 'calculatedNetRevenue'>): Promise<Order> => {
    const employeeCost = calculateEmployeeCostForOrder(newOrderData.startTime, newOrderData.endTime, newOrderData.assignedEmployeeIds, appState.employees);
    const orderAmount = newOrderData.orderAmount;
    const calculatedNetRevenue = orderAmount - employeeCost;

    // Generate order number
    const orderNumber = `UZ${String(appState.orders.length + 1).padStart(4, '0')}`;
    
    const orderToAdd: Omit<Order, 'id'> = {
      ...newOrderData,
      orderNumber,
      calculatedNetRevenue
    };

    if (USE_FIREBASE) {
      // Save to Firebase
      const newOrder = await ordersService.add(orderToAdd);
      const newState = { ...appState, orders: [...appState.orders, newOrder] };
      setAppState(newState);
      return newOrder;
    } else if (USE_LOCAL_STORAGE) {
      // Fallback to local storage
      const newId = `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const newOrder: Order = { ...orderToAdd, id: newId };
      const newState = { ...appState, orders: [...appState.orders, newOrder] };
      setAppState(newState);
      saveToLocalStorage(newState);
      return newOrder;
    } else {
      // Original API call code
      const serverOrder: Order = await fetchApi('/orders', {
        method: 'POST',
        body: JSON.stringify(orderToAdd),
      });
      const newState = { ...appState, orders: [...appState.orders, serverOrder] };
      setAppState(newState);
      return serverOrder;
    }
  }, [fetchApi, appState.employees, appState.orders, saveToLocalStorage]);

  const updateOrder = useCallback(async (updatedOrderClientData: Order) => {
    const employeeCost = calculateEmployeeCostForOrder(updatedOrderClientData.startTime, updatedOrderClientData.endTime, updatedOrderClientData.assignedEmployeeIds, appState.employees);
    const calculatedNetRevenue = updatedOrderClientData.orderAmount - employeeCost;
    const finalUpdatedOrder = { ...updatedOrderClientData, calculatedNetRevenue };

    if (USE_FIREBASE) {
      await ordersService.update(finalUpdatedOrder);
      const newState = { 
        ...appState, 
        orders: appState.orders.map(o => (o.id === finalUpdatedOrder.id ? finalUpdatedOrder : o)) 
      };
      setAppState(newState);
    } else if (USE_LOCAL_STORAGE) {
      const newState = { 
        ...appState, 
        orders: appState.orders.map(o => (o.id === finalUpdatedOrder.id ? finalUpdatedOrder : o)) 
      };
      setAppState(newState);
      saveToLocalStorage(newState);
    } else {
      const serverUpdatedOrder: Order = await fetchApi(`/orders/${finalUpdatedOrder.id}`, {
        method: 'PUT',
        body: JSON.stringify(finalUpdatedOrder),
      });
      const newState = { 
        ...appState, 
        orders: appState.orders.map(o => (o.id === serverUpdatedOrder.id ? serverUpdatedOrder : o)) 
      };
      setAppState(newState);
    }
  }, [fetchApi, appState.employees, appState.orders, saveToLocalStorage]);

  const deleteOrder = useCallback(async (orderId: string) => {
    if (USE_FIREBASE) {
      await ordersService.delete(orderId);
      const newState = { ...appState, orders: appState.orders.filter(o => o.id !== orderId) };
      setAppState(newState);
    } else if (USE_LOCAL_STORAGE) {
      const newState = { ...appState, orders: appState.orders.filter(o => o.id !== orderId) };
      setAppState(newState);
      saveToLocalStorage(newState);
    } else {
      await fetchApi(`/orders/${orderId}`, { method: 'DELETE' });
      const newState = { ...appState, orders: appState.orders.filter(o => o.id !== orderId) };
      setAppState(newState);
    }
  }, [fetchApi, appState.orders, saveToLocalStorage]);

  const toggleOrderPaidStatus = useCallback(async (orderId: string) => {
    const order = appState.orders.find(o => o.id === orderId);
    if (order) {
      const updatedOrder = { ...order, isPaid: !(order.isPaid ?? false) };
      
      if (USE_LOCAL_STORAGE) {
        const newState = { 
          ...appState, 
          orders: appState.orders.map(o => o.id === orderId ? updatedOrder : o) 
        };
        setAppState(newState);
        saveToLocalStorage(newState);
      } else {
        const serverUpdatedOrder: Order = await fetchApi(`/orders/${orderId}`, {
          method: 'PUT',
          body: JSON.stringify(updatedOrder), 
        });
        const newState = { 
          ...appState, 
          orders: appState.orders.map(o => o.id === serverUpdatedOrder.id ? serverUpdatedOrder : o) 
        };
        setAppState(newState);
      }
    }
  }, [fetchApi, appState.orders, saveToLocalStorage]);


  // ----- Expenses -----
  const addExpense = useCallback(async (newExpenseData: Omit<Expense, 'id'>): Promise<Expense> => {
    if (USE_FIREBASE) {
      const newExpense = await expensesService.add(newExpenseData);
      const newState = { ...appState, expenses: [...appState.expenses, newExpense] };
      setAppState(newState);
      return newExpense;
    } else if (USE_LOCAL_STORAGE) {
      const newId = `expense_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const newExpense: Expense = { ...newExpenseData, id: newId };
      const newState = { ...appState, expenses: [...appState.expenses, newExpense] };
      setAppState(newState);
      saveToLocalStorage(newState);
      return newExpense;
    } else {
      const serverExpense: Expense = await fetchApi('/expenses', {
        method: 'POST',
        body: JSON.stringify(newExpenseData),
      });
      const newState = { ...appState, expenses: [...appState.expenses, serverExpense] };
      setAppState(newState);
      return serverExpense;
    }
  }, [fetchApi, appState.expenses, saveToLocalStorage]);

  const updateExpense = useCallback(async (updatedExpense: Expense) => {
    if (USE_FIREBASE) {
      await expensesService.update(updatedExpense);
      const newState = { 
        ...appState, 
        expenses: appState.expenses.map(e => (e.id === updatedExpense.id ? updatedExpense : e)) 
      };
      setAppState(newState);
    } else if (USE_LOCAL_STORAGE) {
      const newState = { 
        ...appState, 
        expenses: appState.expenses.map(e => (e.id === updatedExpense.id ? updatedExpense : e)) 
      };
      setAppState(newState);
      saveToLocalStorage(newState);
    } else {
      const serverUpdatedExpense: Expense = await fetchApi(`/expenses/${updatedExpense.id}`, {
        method: 'PUT',
        body: JSON.stringify(updatedExpense),
      });
      const newState = { 
        ...appState, 
        expenses: appState.expenses.map(e => (e.id === serverUpdatedExpense.id ? serverUpdatedExpense : e)) 
      };
      setAppState(newState);
    }
  }, [fetchApi, appState.expenses, saveToLocalStorage]);

  const deleteExpense = useCallback(async (expenseId: string) => {
    if (USE_FIREBASE) {
      await expensesService.delete(expenseId);
      const newState = { ...appState, expenses: appState.expenses.filter(e => e.id !== expenseId) };
      setAppState(newState);
    } else if (USE_LOCAL_STORAGE) {
      const newState = { ...appState, expenses: appState.expenses.filter(e => e.id !== expenseId) };
      setAppState(newState);
      saveToLocalStorage(newState);
    } else {
      await fetchApi(`/expenses/${expenseId}`, { method: 'DELETE' });
      const newState = { ...appState, expenses: appState.expenses.filter(e => e.id !== expenseId) };
      setAppState(newState);
    }
  }, [fetchApi, appState.expenses, saveToLocalStorage]);

  // ----- Employees -----
  const addEmployee = useCallback(async (employeeData: Omit<Employee, 'id'>): Promise<Employee> => {
    if (USE_FIREBASE) {
      // Save to Firebase
      const newEmployee = await employeesService.add(employeeData);
      const newState = { ...appState, employees: [...appState.employees, newEmployee] };
      setAppState(newState);
      return newEmployee;
    } else if (USE_LOCAL_STORAGE) {
      const newId = `employee_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const newEmployee: Employee = { ...employeeData, id: newId };
      const newState = { ...appState, employees: [...appState.employees, newEmployee] };
      setAppState(newState);
      saveToLocalStorage(newState);
      return newEmployee;
    } else {
      const serverEmployee: Employee = await fetchApi('/employees', {
        method: 'POST',
        body: JSON.stringify(employeeData),
      });
      const newState = { ...appState, employees: [...appState.employees, serverEmployee] };
      setAppState(newState);
      return serverEmployee;
    }
  }, [fetchApi, appState.employees, saveToLocalStorage]);

  const updateEmployee = useCallback(async (employeeId: string, data: Partial<Omit<Employee, 'id'>>) => {
    const currentEmployee = appState.employees.find(emp => emp.id === employeeId);
    if (!currentEmployee) throw new Error("Darbuotojas nerastas");
    const updatedEmployeeData = { ...currentEmployee, ...data };

    if (USE_FIREBASE) {
      await employeesService.update(updatedEmployeeData);
      const newState = { 
        ...appState, 
        employees: appState.employees.map(emp => emp.id === employeeId ? updatedEmployeeData : emp) 
      };
      setAppState(newState);
    } else if (USE_LOCAL_STORAGE) {
      const newState = { 
        ...appState, 
        employees: appState.employees.map(emp => emp.id === employeeId ? updatedEmployeeData : emp) 
      };
      setAppState(newState);
      saveToLocalStorage(newState);
    } else {
      const serverUpdatedEmployee: Employee = await fetchApi(`/employees/${employeeId}`, {
        method: 'PUT',
        body: JSON.stringify(updatedEmployeeData),
      });
      const newState = { 
        ...appState, 
        employees: appState.employees.map(emp => emp.id === serverUpdatedEmployee.id ? serverUpdatedEmployee : emp) 
      };
      setAppState(newState);
    }
  }, [fetchApi, appState.employees, saveToLocalStorage]);
  
  const deleteEmployee = useCallback(async (employeeId: string) => {
    if (USE_FIREBASE) {
      await employeesService.delete(employeeId);
      const newState = { ...appState, employees: appState.employees.filter(emp => emp.id !== employeeId) };
      setAppState(newState);
    } else if (USE_LOCAL_STORAGE) {
      const newState = { ...appState, employees: appState.employees.filter(emp => emp.id !== employeeId) };
      setAppState(newState);
      saveToLocalStorage(newState);
    } else {
      await fetchApi(`/employees/${employeeId}`, { method: 'DELETE' });
      const newState = { ...appState, employees: appState.employees.filter(emp => emp.id !== employeeId) };
      setAppState(newState);
    }
  }, [fetchApi, appState.employees, saveToLocalStorage]);

  // ----- Salary Payouts -----
  const addSalaryPayout = useCallback(async (payoutData: Omit<SalaryPayout, 'id'>): Promise<SalaryPayout> => {
    if (USE_FIREBASE) {
      const newPayout = await salaryPayoutsService.add(payoutData);
      const newState = { ...appState, salaryPayouts: [...appState.salaryPayouts, newPayout] };
      setAppState(newState);
      return newPayout;
    } else if (USE_LOCAL_STORAGE) {
      const newId = `payout_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const newPayout: SalaryPayout = { ...payoutData, id: newId };
      const newState = { ...appState, salaryPayouts: [...appState.salaryPayouts, newPayout] };
      setAppState(newState);
      saveToLocalStorage(newState);
      return newPayout;
    } else {
      const serverPayout: SalaryPayout = await fetchApi('/salarypayouts', {
        method: 'POST',
        body: JSON.stringify(payoutData),
      });
      const newState = { ...appState, salaryPayouts: [...appState.salaryPayouts, serverPayout] };
      setAppState(newState);
      return serverPayout;
    }
  }, [fetchApi, appState.salaryPayouts, saveToLocalStorage]);

  const updateSalaryPayout = useCallback(async (updatedPayout: SalaryPayout) => {
    if (USE_FIREBASE) {
      await salaryPayoutsService.update(updatedPayout);
      const newState = { 
        ...appState, 
        salaryPayouts: appState.salaryPayouts.map(p => p.id === updatedPayout.id ? updatedPayout : p) 
      };
      setAppState(newState);
    } else if (USE_LOCAL_STORAGE) {
      const newState = { 
        ...appState, 
        salaryPayouts: appState.salaryPayouts.map(p => p.id === updatedPayout.id ? updatedPayout : p) 
      };
      setAppState(newState);
      saveToLocalStorage(newState);
    } else {
      const serverUpdatedPayout: SalaryPayout = await fetchApi(`/salarypayouts/${updatedPayout.id}`, {
        method: 'PUT',
        body: JSON.stringify(updatedPayout),
      });
      const newState = { 
        ...appState, 
        salaryPayouts: appState.salaryPayouts.map(p => p.id === serverUpdatedPayout.id ? serverUpdatedPayout : p) 
      };
      setAppState(newState);
    }
  }, [fetchApi, appState.salaryPayouts, saveToLocalStorage]);

  const deleteSalaryPayout = useCallback(async (payoutId: string) => {
    if (USE_FIREBASE) {
      await salaryPayoutsService.delete(payoutId);
      const newState = { ...appState, salaryPayouts: appState.salaryPayouts.filter(p => p.id !== payoutId) };
      setAppState(newState);
    } else if (USE_LOCAL_STORAGE) {
      const newState = { ...appState, salaryPayouts: appState.salaryPayouts.filter(p => p.id !== payoutId) };
      setAppState(newState);
      saveToLocalStorage(newState);
    } else {
      await fetchApi(`/salarypayouts/${payoutId}`, { method: 'DELETE' });
      const newState = { ...appState, salaryPayouts: appState.salaryPayouts.filter(p => p.id !== payoutId) };
      setAppState(newState);
    }
  }, [fetchApi, appState.salaryPayouts, saveToLocalStorage]);

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center"><p className="text-xl text-neutral-700">Kraunami duomenys iš serverio...</p></div>;
  }

  if (error) {
    return <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <p className="text-xl text-red-600">Įvyko klaida:</p>
        <p className="text-md text-neutral-700 mt-2">{error}</p>
        <button 
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-neutral-700 text-white rounded hover:bg-neutral-800"
        >
            Bandykite iš naujo
        </button>
    </div>;
  }

  return (
    <AppContext.Provider value={{ ...appState, now, addOrder, updateOrder, deleteOrder, addExpense, updateExpense, deleteExpense, addEmployee, updateEmployee, deleteEmployee, toggleOrderPaidStatus, addSalaryPayout, updateSalaryPayout, deleteSalaryPayout }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = (): AppContextType => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
