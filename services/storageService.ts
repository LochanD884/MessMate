import { AppState, Customer, Plan, Transaction, User } from '../types';
import { STORAGE_KEY, DEFAULT_PLANS, DEFAULT_USERS, DEFAULT_MENU_ITEMS } from '../constants';

// Initial Empty State
const initialState: AppState = {
  currentUser: null,
  customers: [],
  transactions: [],
  plans: DEFAULT_PLANS,
  settings: {
    subscriptionDays: 3, // Default: Alert 3 days before expiry
    mealThreshold: 5, // Default: Alert if less than 5 meals
    balanceThreshold: 1000, // Default: Alert if due > 1000
  },
  darkMode: false,
  menuItems: DEFAULT_MENU_ITEMS,
};

// Helper to load state
export const loadState = (): AppState => {
  try {
    const serializedState = localStorage.getItem(STORAGE_KEY);
    if (serializedState === null) {
      saveState(initialState);
      return initialState;
    }
    const parsedState = JSON.parse(serializedState);
    // Merge with defaults to handle migrations/new fields
    return { 
      ...initialState, 
      ...parsedState, 
      settings: { ...initialState.settings, ...parsedState.settings },
      menuItems: parsedState.menuItems || DEFAULT_MENU_ITEMS
    };
  } catch (err) {
    console.error("Load state failed", err);
    return initialState;
  }
};

// Helper to save state
export const saveState = (state: AppState) => {
  try {
    const serializedState = JSON.stringify(state);
    localStorage.setItem(STORAGE_KEY, serializedState);
  } catch (err) {
    console.error("Save state failed", err);
  }
};

// Export Logic (CSV)
export const exportDataToCSV = (transactions: Transaction[], customers: Customer[]) => {
  let csvContent = "data:text/csv;charset=utf-8,";
  
  csvContent += "Type,Date,Category,Amount,Description\n";
  transactions.forEach(t => {
    csvContent += `${t.type},${t.date},${t.category || '-'},${t.amount},"${t.description}"\n`;
  });

  csvContent += "\n\nCustomers\nName,Phone,Meals Remaining,Balance\n";
  customers.forEach(c => {
    csvContent += `"${c.name}",${c.phone},${c.mealsRemaining},${c.balance}\n`;
  });

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `messmate_export_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};