import { Employee, ExpenseCategory, PaymentMethod, ServiceType } from './types';

export const MOVER_RATE_CLIENT = 20; // EUR/val vienas krovikas
export const VAN_RATE_CLIENT = 20; // EUR/val mikroautobusas
export const DEFAULT_MOVER_SALARY_RATE = 10; // EUR/val krovikams

// Naujos konstantos
export const MOVING_KM_RATE = 1.10; // EUR/km perkraustymui už miesto
export const CRANE_RENTAL_MIN_HOURS = 2;
export const CRANE_RENTAL_MIN_CHARGE = 140; // EUR už pirmas CRANE_RENTAL_MIN_HOURS
export const CRANE_RENTAL_HOURLY_RATE_AFTER_MIN = 50; // EUR/val po minimalių valandų
export const CRANE_RENTAL_KM_RATE = 1.30; // EUR/km fiskarui

export const INITIAL_EMPLOYEES: Employee[] = [
  { id: 'emp1', name: 'Jonas Jonaitis', hourlyRate: DEFAULT_MOVER_SALARY_RATE, clientRate: 20 },
  { id: 'emp2', name: 'Petras Petraitis', hourlyRate: DEFAULT_MOVER_SALARY_RATE, clientRate: 20 },
  { id: 'emp3', name: 'Antanas Antanaitis', hourlyRate: 12, clientRate: 25 }, // Higher skilled worker
  { id: 'emp4', name: 'Fiskaro Operatorius', hourlyRate: 15, clientRate: 60 }, // Crane operator
];

export const PAYMENT_METHODS_OPTIONS = Object.values(PaymentMethod);
export const EXPENSE_CATEGORIES_OPTIONS = Object.values(ExpenseCategory);
export const SERVICE_TYPE_OPTIONS = Object.values(ServiceType);


export const APP_STORAGE_KEY = 'movingAppStorage';