export enum PaymentMethod {
  CASH = 'Grynais',
  TRANSFER = 'Banko pavedimu',
}

export enum ExpenseCategory {
  FUEL = 'Kuras',
  REPAIRS = 'Remontas',
  ADS_GOOGLE = 'Reklama: Google Ads',
  ADS_PASLAUGOS_LT = 'Reklama: Paslaugos.lt',
  ADS_SKELBIU_LT = 'Reklama: Skelbiu.lt',
  ADS_OTHER = 'Reklama: Kita',
  PACKING_MATERIALS = 'Pakavimo medžiagos',
  OTHER = 'Kita',
}

export interface Employee {
  id: string;
  name: string;
  hourlyRate: number; // What company pays the employee
  clientRate: number; // What company charges customer for this employee
}

export enum ServiceType {
  MOVING = 'Perkraustymo paslaugos',
  CRANE_RENTAL = 'Fiskaro nuoma',
}

export interface Order {
  id: string;
  orderNumber: string;
  serviceType: ServiceType;
  orderDate: string; // YYYY-MM-DD
  startTime: string; // YYYY-MM-DDTHH:mm
  endTime: string; // YYYY-MM-DDTHH:mm
  clientName: string;
  paymentMethod: PaymentMethod;
  orderAmount: number; // Final amount, can be manually entered or calculated
  calculatedNetRevenue?: number; // Order Amount - direct employee cost for this order
  orderSpecificExpenses: number;
  assignedEmployeeIds: string[];
  notes?: string;
  isPaid?: boolean; // For bank transfers
  applyWeekdayOvertime: boolean; 
  extraKilometers: number;
}

export interface Expense {
  id: string;
  date: string; // YYYY-MM-DD
  category: ExpenseCategory;
  amount: number;
  notes?: string;
}

export interface SalaryPayout {
  id: string;
  employeeId: string;
  date: string; // YYYY-MM-DD
  amount: number;
  notes?: string;
}

export interface AppState {
  orders: Order[];
  expenses: Expense[];
  employees: Employee[];
  salaryPayouts: SalaryPayout[]; // Naujas laukas
}

export interface AppContextType extends AppState {
  // Fix: Changed return type to Promise<Order> to match async implementation
  addOrder: (order: Omit<Order, 'id' | 'orderNumber' | 'calculatedNetRevenue'>) => Promise<Order>;
  updateOrder: (order: Order) => void;
  deleteOrder: (orderId: string) => void;
  // Fix: Changed return type to Promise<Expense> to match async implementation
  addExpense: (expense: Omit<Expense, 'id'>) => Promise<Expense>;
  updateExpense: (expense: Expense) => void;
  deleteExpense: (expenseId: string) => void;
  // Fix: Changed return type to Promise<Employee> to match async implementation
  addEmployee: (employeeData: Omit<Employee, 'id'>) => Promise<Employee>;
  updateEmployee: (employeeId: string, data: Partial<Omit<Employee, 'id'>>) => void;
  deleteEmployee: (employeeId: string) => void; 
  toggleOrderPaidStatus: (orderId: string) => void;
  now: Date;
  // Fix: Changed return type to Promise<SalaryPayout> to match async implementation
  addSalaryPayout: (payoutData: Omit<SalaryPayout, 'id'>) => Promise<SalaryPayout>; // Naujas metodas
  updateSalaryPayout: (payout: SalaryPayout) => void; // Naujas metodas
  deleteSalaryPayout: (payoutId: string) => void; // Naujas metodas
}