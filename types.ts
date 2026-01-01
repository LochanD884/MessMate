export enum TransactionType {
  INCOME = 'INCOME', // Cash/Credit added to balance
  EXPENSE = 'EXPENSE', // Money spent
  SUBSCRIPTION = 'SUBSCRIPTION', // Plan purchase
  USAGE = 'USAGE', // Consumed from plan (0 monetary value)
}

export enum UserRole {
  OWNER = 'OWNER',
  STAFF = 'STAFF',
}

export interface MenuItem {
  id: string;
  name: string;
  priceFull: number;
  priceHalf: number;
}

export interface Plan {
  id: string;
  name: string;
  cost: number;
  totalMeals: number;
  validityDays: number;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  planId: string; // References Plan.id
  startDate: string; // ISO Date string
  expiryDate: string; // ISO Date string
  mealsRemaining: number;
  isPostpaid: boolean;
  balance: number; // Positive means they owe money (credit), Negative means they prepaid extra
  isActive: boolean;
  totalBreakDays: number;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  date: string; // ISO Date
  description: string;
  category?: string; // For expenses (e.g., Groceries, Rent)
  customerId?: string; // Optional link to customer
}

export interface User {
  username: string;
  pinHash: string; // In real app, bcrypt hash
  role: UserRole;
}

export interface ReminderSettings {
  subscriptionDays: number; // Alert X days before expiry
  mealThreshold: number; // Alert if meals are less than X
  balanceThreshold: number; // Alert if balance exceeds X
}

export interface AppState {
  currentUser: User | null;
  customers: Customer[];
  transactions: Transaction[];
  plans: Plan[];
  settings: ReminderSettings;
  darkMode: boolean;
  menuItems: MenuItem[];
}