import { Plan, User, UserRole, MenuItem } from './types';

export const APP_NAME = "MessMate";
export const STORAGE_KEY = "messmate_db_v2";

// Default Plans if none exist
export const DEFAULT_PLANS: Plan[] = [
  {
    id: 'plan_1',
    name: 'Full Month Mess',
    cost: 3500,
    totalMeals: 60, // Lunch + Dinner
    validityDays: 30
  },
  {
    id: 'plan_2',
    name: 'Single Meal Monthly',
    cost: 2000,
    totalMeals: 30,
    validityDays: 30
  },
  {
    id: 'plan_3',
    name: '15 Days Trial',
    cost: 1800,
    totalMeals: 30, 
    validityDays: 15
  }
];

export const DEFAULT_MENU_ITEMS: MenuItem[] = [
  { id: 'm1', name: 'Veg Thali', priceFull: 80, priceHalf: 50 },
  { id: 'm2', name: 'Chicken Thali', priceFull: 150, priceHalf: 100 },
  { id: 'm3', name: 'Egg Rice', priceFull: 90, priceHalf: 60 },
  { id: 'm4', name: 'Curd Rice', priceFull: 60, priceHalf: 40 },
  { id: 'm5', name: 'Special Sunday', priceFull: 200, priceHalf: 120 },
];

export const GROCERY_CATEGORIES = [
  "Vegetables",
  "Rice & Wheat",
  "Meat & Dairy",
  "Oil & Spices",
  "Gas Cylinder",
  "Rent/Electricity",
  "Others"
];

// Mock Users (In production, this would be in a secure DB)
export const DEFAULT_USERS: User[] = [
  {
    username: 'admin',
    pinHash: '1234', // Simple pin for demo
    role: UserRole.OWNER
  },
  {
    username: 'staff',
    pinHash: '0000',
    role: UserRole.STAFF
  }
];