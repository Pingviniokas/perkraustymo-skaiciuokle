import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  setDoc,
  getDoc,
  query,
  orderBy,
  onSnapshot,
  Timestamp
} from 'firebase/firestore';
import { db } from './firebase';
import { Order, Expense, Employee, SalaryPayout, AppState } from '../types';

// Collection names
const COLLECTIONS = {
  ORDERS: 'orders',
  EXPENSES: 'expenses',
  EMPLOYEES: 'employees',
  SALARY_PAYOUTS: 'salaryPayouts'
};

// Helper function to convert Firestore timestamps to strings
const convertTimestamps = (data: any) => {
  if (data && typeof data === 'object') {
    const converted = { ...data };
    Object.keys(converted).forEach(key => {
      if (converted[key] instanceof Timestamp) {
        converted[key] = converted[key].toDate().toISOString();
      }
    });
    return converted;
  }
  return data;
};

// Orders
export const ordersService = {
  async getAll(): Promise<Order[]> {
    const ordersCol = collection(db, COLLECTIONS.ORDERS);
    const ordersSnapshot = await getDocs(query(ordersCol, orderBy('orderDate', 'desc')));
    return ordersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...convertTimestamps(doc.data())
    } as Order));
  },

  async add(orderData: Omit<Order, 'id'>): Promise<Order> {
    const ordersCol = collection(db, COLLECTIONS.ORDERS);
    const docRef = await addDoc(ordersCol, orderData);
    return { id: docRef.id, ...orderData };
  },

  async update(order: Order): Promise<void> {
    const orderDoc = doc(db, COLLECTIONS.ORDERS, order.id);
    const { id, ...updateData } = order;
    await updateDoc(orderDoc, updateData);
  },

  async delete(orderId: string): Promise<void> {
    const orderDoc = doc(db, COLLECTIONS.ORDERS, orderId);
    await deleteDoc(orderDoc);
  }
};

// Expenses
export const expensesService = {
  async getAll(): Promise<Expense[]> {
    const expensesCol = collection(db, COLLECTIONS.EXPENSES);
    const expensesSnapshot = await getDocs(query(expensesCol, orderBy('date', 'desc')));
    return expensesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...convertTimestamps(doc.data())
    } as Expense));
  },

  async add(expenseData: Omit<Expense, 'id'>): Promise<Expense> {
    const expensesCol = collection(db, COLLECTIONS.EXPENSES);
    const docRef = await addDoc(expensesCol, expenseData);
    return { id: docRef.id, ...expenseData };
  },

  async update(expense: Expense): Promise<void> {
    const expenseDoc = doc(db, COLLECTIONS.EXPENSES, expense.id);
    const { id, ...updateData } = expense;
    await updateDoc(expenseDoc, updateData);
  },

  async delete(expenseId: string): Promise<void> {
    const expenseDoc = doc(db, COLLECTIONS.EXPENSES, expenseId);
    await deleteDoc(expenseDoc);
  }
};

// Employees
export const employeesService = {
  async getAll(): Promise<Employee[]> {
    const employeesCol = collection(db, COLLECTIONS.EMPLOYEES);
    const employeesSnapshot = await getDocs(employeesCol);
    return employeesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...convertTimestamps(doc.data())
    } as Employee));
  },

  async add(employeeData: Omit<Employee, 'id'>): Promise<Employee> {
    const employeesCol = collection(db, COLLECTIONS.EMPLOYEES);
    const docRef = await addDoc(employeesCol, employeeData);
    return { id: docRef.id, ...employeeData };
  },

  async update(employee: Employee): Promise<void> {
    const employeeDoc = doc(db, COLLECTIONS.EMPLOYEES, employee.id);
    const { id, ...updateData } = employee;
    await updateDoc(employeeDoc, updateData);
  },

  async delete(employeeId: string): Promise<void> {
    const employeeDoc = doc(db, COLLECTIONS.EMPLOYEES, employeeId);
    await deleteDoc(employeeDoc);
  }
};

// Salary Payouts
export const salaryPayoutsService = {
  async getAll(): Promise<SalaryPayout[]> {
    const payoutsCol = collection(db, COLLECTIONS.SALARY_PAYOUTS);
    const payoutsSnapshot = await getDocs(query(payoutsCol, orderBy('date', 'desc')));
    return payoutsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...convertTimestamps(doc.data())
    } as SalaryPayout));
  },

  async add(payoutData: Omit<SalaryPayout, 'id'>): Promise<SalaryPayout> {
    const payoutsCol = collection(db, COLLECTIONS.SALARY_PAYOUTS);
    const docRef = await addDoc(payoutsCol, payoutData);
    return { id: docRef.id, ...payoutData };
  },

  async update(payout: SalaryPayout): Promise<void> {
    const payoutDoc = doc(db, COLLECTIONS.SALARY_PAYOUTS, payout.id);
    const { id, ...updateData } = payout;
    await updateDoc(payoutDoc, updateData);
  },

  async delete(payoutId: string): Promise<void> {
    const payoutDoc = doc(db, COLLECTIONS.SALARY_PAYOUTS, payoutId);
    await deleteDoc(payoutDoc);
  }
};

// Get all data at once
export const getAllData = async (): Promise<AppState> => {
  try {
    const [orders, expenses, employees, salaryPayouts] = await Promise.all([
      ordersService.getAll(),
      expensesService.getAll(),
      employeesService.getAll(),
      salaryPayoutsService.getAll()
    ]);

    return {
      orders,
      expenses,
      employees,
      salaryPayouts
    };
  } catch (error) {
    console.error('Error fetching data from Firebase:', error);
    throw error;
  }
};

// Real-time listeners (optional - for real-time updates)
export const subscribeToOrders = (callback: (orders: Order[]) => void) => {
  const ordersCol = collection(db, COLLECTIONS.ORDERS);
  return onSnapshot(query(ordersCol, orderBy('orderDate', 'desc')), (snapshot) => {
    const orders = snapshot.docs.map(doc => ({
      id: doc.id,
      ...convertTimestamps(doc.data())
    } as Order));
    callback(orders);
  });
}; 