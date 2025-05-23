import { Order, Expense, Employee, PaymentMethod, ServiceType, SalaryPayout } from '../types';
import { 
    MOVER_RATE_CLIENT, 
    VAN_RATE_CLIENT, 
    MOVING_KM_RATE,
    CRANE_RENTAL_MIN_HOURS,
    CRANE_RENTAL_MIN_CHARGE,
    CRANE_RENTAL_HOURLY_RATE_AFTER_MIN,
    CRANE_RENTAL_KM_RATE
} from '../constants';
import { calculateDurationHours, getMonthYear, isWeekend } from './helpers';

export const calculateOrderAmount = (
  serviceType: ServiceType,
  startTimeStr: string,
  endTimeStr: string,
  assignedEmployeeIds: string[],
  employees: Employee[],
  orderDateStr: string,
  applyWeekdayOvertime: boolean,
  extraKilometers: number
): number => {
  let timeBasedAmount = 0;
  let kilometerCost = 0;
  const duration = calculateDurationHours(startTimeStr, endTimeStr);

  if (serviceType === ServiceType.MOVING) {
    if (duration > 0) {
        const totalMoverClientRate = assignedEmployeeIds.reduce((sum, empId) => {
          const employee = employees.find(e => e.id === empId);
          if (employee && !employee.name.toLowerCase().includes('fiskaro')) {
            return sum + employee.clientRate;
          }
          return sum;
        }, 0);
        
        const hourlyRateForMovingTime = totalMoverClientRate + VAN_RATE_CLIENT;
        if (isWeekend(orderDateStr)) {
            timeBasedAmount = hourlyRateForMovingTime * duration * 1.5;
        } else { 
            if (applyWeekdayOvertime) {
                const overtimeThresholdHour = 17;
                let normalDurationPart = 0;
                let overtimeDurationPart = 0;
                const start = new Date(startTimeStr);
                const end = new Date(endTimeStr);
                const orderDateObject = new Date(orderDateStr);
                const thresholdTime = new Date(orderDateObject.getFullYear(), orderDateObject.getMonth(), orderDateObject.getDate(), overtimeThresholdHour, 0, 0);
                const normalizedStart = new Date(orderDateObject.getFullYear(), orderDateObject.getMonth(), orderDateObject.getDate(), start.getHours(), start.getMinutes(), start.getSeconds());
                const normalizedEnd = new Date(orderDateObject.getFullYear(), orderDateObject.getMonth(), orderDateObject.getDate(), end.getHours(), end.getMinutes(), end.getSeconds());

                if (normalizedEnd <= thresholdTime) {
                    normalDurationPart = duration;
                } else if (normalizedStart >= thresholdTime) {
                    overtimeDurationPart = duration;
                } else {
                    const thresholdDateTimeStr = `${start.toISOString().split('T')[0]}T${overtimeThresholdHour.toString().padStart(2, '0')}:00`;
                    normalDurationPart = calculateDurationHours(startTimeStr, thresholdDateTimeStr);
                    overtimeDurationPart = calculateDurationHours(thresholdDateTimeStr, endTimeStr);
                }
                normalDurationPart = Math.max(0, normalDurationPart);
                overtimeDurationPart = Math.max(0, overtimeDurationPart);
                const normalCost = hourlyRateForMovingTime * normalDurationPart;
                const overtimeCost = (hourlyRateForMovingTime * overtimeDurationPart) * 1.5;
                timeBasedAmount = normalCost + overtimeCost;
            } else { 
                timeBasedAmount = hourlyRateForMovingTime * duration;
            }
        }
    }
    kilometerCost = extraKilometers * MOVING_KM_RATE;
  } else if (serviceType === ServiceType.CRANE_RENTAL) {
    if (duration > 0) {
        if (duration <= CRANE_RENTAL_MIN_HOURS) {
            timeBasedAmount = CRANE_RENTAL_MIN_CHARGE;
        } else {
            timeBasedAmount = CRANE_RENTAL_MIN_CHARGE + (duration - CRANE_RENTAL_MIN_HOURS) * CRANE_RENTAL_HOURLY_RATE_AFTER_MIN;
        }
    }
    kilometerCost = extraKilometers * CRANE_RENTAL_KM_RATE;
  }
  if (duration <= 0 && extraKilometers <= 0) return 0;
  return timeBasedAmount + kilometerCost;
};

export const calculateEmployeeCostForOrder = (startTime: string, endTime: string, assignedEmployeeIds: string[], employees: Employee[]): number => {
  const duration = calculateDurationHours(startTime, endTime);
  if (duration <= 0) return 0;
  let totalCost = 0;
  assignedEmployeeIds.forEach(empId => {
    const employee = employees.find(e => e.id === empId);
    if (employee) {
      totalCost += employee.hourlyRate * duration;
    }
  });
  return totalCost;
};

export interface DailyFinancials {
  date: string;
  totalOrdersAmount: number;
  totalExpensesAmount: number;
  totalEmployeeSalaries: number; // Uždirbta
  totalSalaryPayoutsOnDate: number; // Išmokėta
  profit: number; // Pajamos - Išlaidos - Uždirbti atlyginimai
  cashExpected: number;
  bankTransfersExpected: number;
  pendingBankTransfers: number;
}

export const calculateDailyFinancials = (date: string, orders: Order[], expenses: Expense[], employees: Employee[], salaryPayouts: SalaryPayout[]): DailyFinancials => {
  const dailyOrders = orders.filter(o => o.orderDate === date);
  const dailyExpenses = expenses.filter(e => e.date === date);
  const dailySalaryPayouts = salaryPayouts.filter(p => p.date === date);

  const totalOrdersAmount = dailyOrders.reduce((sum, o) => sum + o.orderAmount, 0);
  const totalExpensesAmount = dailyExpenses.reduce((sum, e) => sum + e.amount, 0);
  const totalSalaryPayoutsOnDate = dailySalaryPayouts.reduce((sum, p) => sum + p.amount, 0);
  
  let totalEmployeeSalaries = 0; // Uždirbta
  dailyOrders.forEach(order => {
    totalEmployeeSalaries += calculateEmployeeCostForOrder(order.startTime, order.endTime, order.assignedEmployeeIds, employees);
  });
  
  const profit = totalOrdersAmount - totalExpensesAmount - totalEmployeeSalaries;

  const cashExpected = dailyOrders
    .filter(o => o.paymentMethod === PaymentMethod.CASH)
    .reduce((sum, o) => sum + o.orderAmount, 0);

  const bankTransfersExpected = dailyOrders
    .filter(o => o.paymentMethod === PaymentMethod.TRANSFER)
    .reduce((sum, o) => sum + o.orderAmount, 0);

  const pendingBankTransfers = dailyOrders
    .filter(o => o.paymentMethod === PaymentMethod.TRANSFER && !o.isPaid)
    .reduce((sum, o) => sum + o.orderAmount, 0);

  return {
    date,
    totalOrdersAmount,
    totalExpensesAmount,
    totalEmployeeSalaries,
    totalSalaryPayoutsOnDate,
    profit,
    cashExpected,
    bankTransfersExpected,
    pendingBankTransfers,
  };
};

export interface MonthlyFinancials extends Omit<DailyFinancials, 'date' | 'pendingBankTransfers' | 'totalSalaryPayoutsOnDate'> {
  month: string; // YYYY-MM
  totalOrders: number;
  expensesByCategory: { [category: string]: number };
  totalPendingBankTransfers: number;
  totalSalaryPayoutsInMonth: number; // Išmokėta per mėnesį
}

export const calculateMonthlyFinancials = (month: string, orders: Order[], expenses: Expense[], employees: Employee[], salaryPayouts: SalaryPayout[]): MonthlyFinancials => {
  const monthlyOrders = orders.filter(o => getMonthYear(o.orderDate) === month);
  const monthlyExpenses = expenses.filter(e => getMonthYear(e.date) === month);
  const monthlySalaryPayouts = salaryPayouts.filter(p => getMonthYear(p.date) === month);

  const totalOrdersAmount = monthlyOrders.reduce((sum, o) => sum + o.orderAmount, 0);
  const totalExpensesAmount = monthlyExpenses.reduce((sum, e) => sum + e.amount, 0);
  const totalSalaryPayoutsInMonth = monthlySalaryPayouts.reduce((sum, p) => sum + p.amount, 0);

  let totalEmployeeSalaries = 0; // Uždirbta
  monthlyOrders.forEach(order => {
    totalEmployeeSalaries += calculateEmployeeCostForOrder(order.startTime, order.endTime, order.assignedEmployeeIds, employees);
  });

  const profit = totalOrdersAmount - totalExpensesAmount - totalEmployeeSalaries;

  const cashExpected = monthlyOrders
    .filter(o => o.paymentMethod === PaymentMethod.CASH)
    .reduce((sum, o) => sum + o.orderAmount, 0);

  const bankTransfersExpected = monthlyOrders
    .filter(o => o.paymentMethod === PaymentMethod.TRANSFER)
    .reduce((sum, o) => sum + o.orderAmount, 0);
  
  const totalPendingBankTransfers = monthlyOrders
    .filter(o => o.paymentMethod === PaymentMethod.TRANSFER && !o.isPaid)
    .reduce((sum, o) => sum + o.orderAmount, 0);

  const expensesByCategory: { [category: string]: number } = {};
  monthlyExpenses.forEach(expense => {
    expensesByCategory[expense.category] = (expensesByCategory[expense.category] || 0) + expense.amount;
  });

  return {
    month,
    totalOrders: monthlyOrders.length,
    totalOrdersAmount,
    totalExpensesAmount,
    totalEmployeeSalaries,
    totalSalaryPayoutsInMonth,
    profit,
    cashExpected,
    bankTransfersExpected,
    expensesByCategory,
    totalPendingBankTransfers,
  };
};

export interface EmployeeMonthlySummary {
  employeeId: string;
  employeeName: string;
  month: string; // YYYY-MM
  totalHours: number;
  totalSalary: number; // Uždirbta
  hourlyRate: number;
  totalPaidOut: number; // Išmokėta
  outstandingBalance: number; // Likutis
}

export const calculateEmployeeMonthlySummary = (month: string, employee: Employee, orders: Order[], salaryPayouts: SalaryPayout[]): EmployeeMonthlySummary => {
  let totalHours = 0;
  let totalSalary = 0;

  orders.forEach(order => {
    if (getMonthYear(order.orderDate) === month && order.assignedEmployeeIds.includes(employee.id)) {
      const duration = calculateDurationHours(order.startTime, order.endTime);
      if (duration > 0) {
        totalHours += duration;
        totalSalary += duration * employee.hourlyRate;
      }
    }
  });

  const totalPaidOut = salaryPayouts
    .filter(p => p.employeeId === employee.id && getMonthYear(p.date) === month)
    .reduce((sum, p) => sum + p.amount, 0);

  const outstandingBalance = totalSalary - totalPaidOut;

  return {
    employeeId: employee.id,
    employeeName: employee.name,
    month,
    totalHours,
    totalSalary,
    hourlyRate: employee.hourlyRate,
    totalPaidOut,
    outstandingBalance,
  };
};
