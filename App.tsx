import React, { useState, useEffect } from 'react';
import { loadState, saveState, exportDataToCSV } from './services/storageService';
import { AppState, User, Customer, Transaction, Plan, TransactionType, ReminderSettings, MenuItem } from './types';
import { DEFAULT_USERS, GROCERY_CATEGORIES } from './constants';
import { 
  Users, 
  Wallet, 
  LayoutDashboard, 
  LogOut, 
  Plus, 
  Search, 
  Utensils, 
  Settings, 
  ArrowUpRight, 
  ArrowDownLeft,
  CalendarPlus,
  Moon,
  Sun,
  Bell,
  AlertTriangle,
  ChevronRight,
  Minus,
  AlertCircle
} from 'lucide-react';

// --- HELPER FUNCTIONS ---
const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: '2-digit'
  });
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount);
};

// --- COMPONENTS ---

// 1. Auth Screen
const AuthScreen = ({ onLogin }: { onLogin: (user: User) => void }) => {
  const [username, setUsername] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  const handleLogin = () => {
    const user = DEFAULT_USERS.find(u => u.username.toLowerCase() === username.toLowerCase() && u.pinHash === pin);
    if (user) {
      onLogin(user);
    } else {
      setError('Wrong Name or PIN');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full bg-slate-900 text-white p-6">
      <div className="mb-8 p-6 bg-orange-500 rounded-full shadow-2xl">
        <Utensils size={64} className="text-white" />
      </div>
      <h1 className="text-4xl font-bold mb-2 tracking-tight">MessMate</h1>
      <p className="text-slate-400 mb-10 text-lg">Hotel Manager</p>
      
      <div className="w-full max-w-sm space-y-6">
        <div>
          <label className="text-sm uppercase text-slate-400 font-bold ml-1 mb-2 block">Who are you?</label>
          <input 
            type="text" 
            value={username}
            onChange={e => setUsername(e.target.value)}
            className="w-full bg-slate-800 border-2 border-slate-700 rounded-xl p-4 text-xl text-white focus:outline-none focus:border-orange-500 transition-colors"
            placeholder="admin"
          />
        </div>
        <div>
          <label className="text-sm uppercase text-slate-400 font-bold ml-1 mb-2 block">Secret PIN</label>
          <input 
            type="tel" 
            value={pin}
            onChange={e => setPin(e.target.value)}
            className="w-full bg-slate-800 border-2 border-slate-700 rounded-xl p-4 text-xl text-white focus:outline-none focus:border-orange-500 transition-colors"
            placeholder="****"
          />
        </div>
        {error && <div className="bg-red-500/20 border border-red-500 p-3 rounded-lg text-red-200 text-center font-bold">{error}</div>}
        <button 
          onClick={handleLogin}
          className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold text-xl py-4 rounded-xl shadow-lg active:scale-95 transition-transform"
        >
          ENTER
        </button>
      </div>
    </div>
  );
};

// 2. Dashboard Component
const Dashboard = ({ 
  customers, 
  transactions, 
  settings, 
  onScanMeal 
}: { 
  customers: Customer[], 
  transactions: Transaction[], 
  settings: ReminderSettings,
  onScanMeal: () => void 
}) => {
  const today = new Date().toISOString().split('T')[0];
  const activeCustomers = customers.filter(c => c.isActive && new Date(c.expiryDate) >= new Date()).length;
  
  // Logic: Exclude 'USAGE' (Plan meals) from Income calculations
  const incomeThisMonth = transactions
    .filter(t => 
      (t.type === TransactionType.INCOME || t.type === TransactionType.SUBSCRIPTION) && 
      t.date.startsWith(today.substring(0, 7))
    )
    .reduce((acc, curr) => acc + curr.amount, 0);

  const expenseThisMonth = transactions
    .filter(t => t.type === TransactionType.EXPENSE && t.date.startsWith(today.substring(0, 7)))
    .reduce((acc, curr) => acc + curr.amount, 0);

  // --- ALERTS LOGIC ---
  const renewals = customers
    .filter(c => {
      if (!c.isActive) return false;
      const expiry = new Date(c.expiryDate);
      const now = new Date();
      const diffTime = expiry.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
      
      const isDateNear = diffDays <= settings.subscriptionDays;
      const isMealsLow = c.mealsRemaining <= settings.mealThreshold;
      
      return isDateNear || isMealsLow;
    })
    .map(c => {
      const expiry = new Date(c.expiryDate);
      const now = new Date();
      const diffDays = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return { ...c, urgencyScore: diffDays + c.mealsRemaining };
    })
    .sort((a, b) => a.urgencyScore - b.urgencyScore);

  const pendingPayments = customers
    .filter(c => c.balance > settings.balanceThreshold)
    .sort((a, b) => b.balance - a.balance);

  return (
    <div className="p-4 space-y-6 pb-24 h-full overflow-y-auto">
      <header className="flex justify-between items-end mb-4">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-800 dark:text-white">Hello, Owner!</h2>
          <p className="text-slate-500 dark:text-slate-400 text-lg font-medium">{formatDate(today)}</p>
        </div>
      </header>

      {/* BIG ACTION BUTTON */}
      <button 
        onClick={onScanMeal} 
        className="w-full bg-orange-500 text-white p-6 rounded-2xl shadow-xl active:scale-95 transition-all flex items-center justify-center gap-4 border-b-4 border-orange-700"
      >
         <Utensils size={40} />
         <span className="text-2xl font-bold uppercase tracking-wider">Mark Meal</span>
      </button>

      {/* --- ALERTS SECTION --- */}
      {(renewals.length > 0 || pendingPayments.length > 0) && (
        <div className="space-y-4">
          <h3 className="text-sm font-bold uppercase text-slate-500 dark:text-slate-400 ml-1">Notifications</h3>
          
          {/* Renewals Group */}
          {renewals.length > 0 && (
            <div className="bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800 rounded-2xl overflow-hidden">
               <div className="bg-yellow-100 dark:bg-yellow-800/40 p-3 px-4 flex items-center gap-2">
                  <Bell size={20} className="text-yellow-700 dark:text-yellow-400" />
                  <span className="font-bold text-yellow-800 dark:text-yellow-200 uppercase text-sm">Renewals Due</span>
               </div>
               <div className="divide-y divide-yellow-100 dark:divide-yellow-800/30">
                 {renewals.slice(0, 3).map(c => (
                   <div key={c.id} className="p-4 flex justify-between items-center">
                     <div>
                       <p className="font-bold text-slate-800 dark:text-white">{c.name}</p>
                       <p className="text-xs text-slate-500 dark:text-slate-400">
                         {c.mealsRemaining} meals left • Expires in {Math.ceil((new Date(c.expiryDate).getTime() - new Date().getTime()) / (86400000))} days
                       </p>
                     </div>
                     <ChevronRight className="text-yellow-400" size={16} />
                   </div>
                 ))}
                 {renewals.length > 3 && (
                   <div className="p-3 text-center text-xs font-bold text-yellow-600 dark:text-yellow-400">
                     + {renewals.length - 3} more
                   </div>
                 )}
               </div>
            </div>
          )}

          {/* Pending Payments Group */}
          {pendingPayments.length > 0 && (
            <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-2xl overflow-hidden">
               <div className="bg-red-100 dark:bg-red-800/40 p-3 px-4 flex items-center gap-2">
                  <AlertTriangle size={20} className="text-red-700 dark:text-red-400" />
                  <span className="font-bold text-red-800 dark:text-red-200 uppercase text-sm">Pending Payments</span>
               </div>
               <div className="divide-y divide-red-100 dark:divide-red-800/30">
                 {pendingPayments.slice(0, 3).map(c => (
                   <div key={c.id} className="p-4 flex justify-between items-center">
                     <div>
                       <p className="font-bold text-slate-800 dark:text-white">{c.name}</p>
                       <p className="text-xs text-slate-500 dark:text-slate-400">Balance Exceeded Limit</p>
                     </div>
                     <span className="font-bold text-red-600 dark:text-red-400">{formatCurrency(c.balance)}</span>
                   </div>
                 ))}
                 {pendingPayments.length > 3 && (
                   <div className="p-3 text-center text-xs font-bold text-red-600 dark:text-red-400">
                     + {pendingPayments.length - 3} more
                   </div>
                 )}
               </div>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
          <p className="text-slate-500 dark:text-slate-400 text-sm font-bold uppercase">Active Members</p>
          <p className="text-4xl font-extrabold text-slate-800 dark:text-white mt-2">{activeCustomers}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
          <p className="text-slate-500 dark:text-slate-400 text-sm font-bold uppercase">Today's Date</p>
          <p className="text-4xl font-extrabold text-blue-600 dark:text-blue-400 mt-2">{new Date().getDate()}</p>
        </div>
      </div>

      <div className="bg-slate-800 dark:bg-slate-900 text-white rounded-2xl p-6 shadow-lg border border-slate-700">
        <p className="text-slate-400 text-sm font-bold uppercase mb-6">Money This Month</p>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-500/20 rounded-xl text-green-400">
                <ArrowDownLeft size={28} />
              </div>
              <span className="text-xl font-medium text-slate-300">Income</span>
            </div>
            <p className="font-bold text-2xl text-green-400">{formatCurrency(incomeThisMonth)}</p>
          </div>
          
          <div className="h-px bg-slate-700 w-full"></div>

          <div className="flex justify-between items-center">
             <div className="flex items-center gap-3">
               <div className="p-3 bg-red-500/20 rounded-xl text-red-400">
                <ArrowUpRight size={28} />
              </div>
              <span className="text-xl font-medium text-slate-300">Spent</span>
            </div>
             <p className="font-bold text-2xl text-red-400">{formatCurrency(expenseThisMonth)}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// 3. Customer List
const CustomerList = ({ 
  customers, 
  plans, 
  menuItems,
  onAddCustomer, 
  onMarkMeal,
  onAddBreak
}: { 
  customers: Customer[], 
  plans: Plan[], 
  menuItems: MenuItem[],
  onAddCustomer: (c: Customer) => void,
  onMarkMeal: (customerId: string, item: MenuItem, portion: 'half'|'full', quantity: number) => void,
  onAddBreak: (id: string, days: number) => void
}) => {
  const [filter, setFilter] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBreakModal, setShowBreakModal] = useState<string | null>(null);
  const [breakDays, setBreakDays] = useState('1');
  
  // Meal Entry Modal State
  const [showMealModal, setShowMealModal] = useState<string | null>(null); 
  const [selectedMenuItem, setSelectedMenuItem] = useState(menuItems[0].id);
  const [portion, setPortion] = useState<'full' | 'half'>('full');
  const [quantity, setQuantity] = useState(1);

  // New Customer Form State
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [selectedPlanId, setSelectedPlanId] = useState(plans[0]?.id || '');

  const filtered = customers.filter(c => c.name.toLowerCase().includes(filter.toLowerCase()) || c.phone.includes(filter));

  const handleSaveCustomer = () => {
    if (!newName) return;
    const plan = plans.find(p => p.id === selectedPlanId);
    if (!plan) return;
    
    const newCustomer: Customer = {
      id: crypto.randomUUID(),
      name: newName,
      phone: newPhone || 'No Phone',
      planId: selectedPlanId,
      startDate: new Date().toISOString(),
      expiryDate: new Date(Date.now() + (plan.validityDays * 86400000)).toISOString(),
      mealsRemaining: plan.totalMeals,
      isPostpaid: false,
      balance: 0,
      isActive: true,
      totalBreakDays: 0
    };
    onAddCustomer(newCustomer);
    setShowAddModal(false);
    setNewName('');
    setNewPhone('');
  };

  const handleSaveBreak = () => {
    if (showBreakModal && breakDays) {
      onAddBreak(showBreakModal, parseInt(breakDays));
      setShowBreakModal(null);
      setBreakDays('1');
    }
  };

  const handleConfirmMeal = () => {
    if (showMealModal) {
      const item = menuItems.find(m => m.id === selectedMenuItem);
      if (item) {
        onMarkMeal(showMealModal, item, portion, quantity);
        setShowMealModal(null);
        setQuantity(1);
        setPortion('full');
      }
    }
  };
  
  // Calculations for Modal UI
  const currentCustomer = customers.find(c => c.id === showMealModal);
  const selectedItemData = menuItems.find(m => m.id === selectedMenuItem);
  const totalCost = (selectedItemData?.[portion === 'full' ? 'priceFull' : 'priceHalf'] || 0) * quantity;
  
  // Subscription Logic Breakdown for UI
  const mealsLeft = currentCustomer?.mealsRemaining || 0;
  const mealsCovered = Math.min(mealsLeft, quantity); // How many are free?
  const mealsPayable = Math.max(0, quantity - mealsCovered); // How many to pay for?
  
  // Approximation for mixed payment (if items have same price, simple logic, else complex. Assuming uniform unit cost for simplicity in display)
  const unitPrice = selectedItemData?.[portion === 'full' ? 'priceFull' : 'priceHalf'] || 0;
  const costPayable = mealsPayable * unitPrice;

  return (
    <div className="h-full flex flex-col bg-slate-100 dark:bg-slate-950">
      <div className="p-4 bg-white dark:bg-slate-900 shadow-sm z-10 sticky top-0 border-b dark:border-slate-800">
        <div className="relative">
          <Search className="absolute left-4 top-4 text-slate-400" size={24} />
          <input 
            type="text" 
            placeholder="Type Name or Number..." 
            value={filter}
            onChange={e => setFilter(e.target.value)}
            className="w-full bg-slate-100 dark:bg-slate-800 dark:text-white rounded-xl pl-12 p-4 text-lg outline-none focus:ring-2 ring-orange-500 border border-slate-200 dark:border-slate-700"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-24">
        {filtered.map(customer => {
          const plan = plans.find(p => p.id === customer.planId);
          const isExpired = new Date(customer.expiryDate) < new Date();
          const isLowMeals = customer.mealsRemaining <= 5;

          return (
            <div key={customer.id} className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col gap-4">
              
              {/* Header Info */}
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-2xl font-extrabold text-slate-800 dark:text-white">{customer.name}</h3>
                  <p className="text-slate-500 dark:text-slate-400 font-medium text-lg mt-1">{customer.phone}</p>
                </div>
                <div className={`px-3 py-1 rounded-lg font-bold text-xs uppercase ${isExpired ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' : 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'}`}>
                  {isExpired ? 'Expired' : 'Active'}
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-3 bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-slate-700">
                <div>
                   <p className="text-xs text-slate-400 font-bold uppercase">Meals Left</p>
                   <p className={`text-xl font-bold ${isLowMeals ? 'text-red-500' : 'text-slate-800 dark:text-white'}`}>{customer.mealsRemaining}</p>
                </div>
                <div>
                   <p className="text-xs text-slate-400 font-bold uppercase">Valid Till</p>
                   <p className="text-xl font-bold text-slate-800 dark:text-white">{formatDate(customer.expiryDate)}</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 mt-1">
                <button 
                  onClick={() => setShowMealModal(customer.id)}
                  disabled={isExpired && customer.mealsRemaining <= 0} 
                  className={`flex-1 py-4 rounded-xl flex items-center justify-center gap-2 font-bold text-lg shadow-sm active:scale-95 transition-transform ${isExpired && customer.mealsRemaining <= 0 ? 'bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500' : 'bg-green-500 text-white'}`}
                >
                  <Utensils size={24} />
                  EAT MEAL
                </button>
                <button 
                  onClick={() => setShowBreakModal(customer.id)}
                  className="px-6 py-4 bg-yellow-400 dark:bg-yellow-600 text-yellow-900 dark:text-white rounded-xl font-bold shadow-sm active:scale-95 transition-transform flex flex-col items-center justify-center leading-none"
                >
                  <CalendarPlus size={24} />
                  <span className="text-[10px] uppercase mt-1">Leave</span>
                </button>
              </div>

            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="text-center text-slate-400 mt-10">
            <p className="text-xl">No members found.</p>
          </div>
        )}
      </div>

      <button 
        onClick={() => setShowAddModal(true)}
        className="absolute bottom-24 right-6 bg-blue-600 text-white p-5 rounded-full shadow-2xl border-4 border-white dark:border-slate-800 active:scale-90 transition-transform"
      >
        <Plus size={32} />
      </button>

      {/* Add Customer Modal */}
      {showAddModal && (
        <div className="absolute inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-3xl p-6 shadow-2xl border dark:border-slate-800">
            <h3 className="text-2xl font-extrabold mb-6 text-slate-800 dark:text-white">New Member</h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase ml-1">Full Name</label>
                <input 
                  className="w-full p-4 border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white rounded-xl text-lg focus:border-blue-500 outline-none" 
                  placeholder="e.g. Rahul Kumar" 
                  value={newName} 
                  onChange={e => setNewName(e.target.value)} 
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase ml-1">Phone Number</label>
                <input 
                  type="tel"
                  className="w-full p-4 border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white rounded-xl text-lg focus:border-blue-500 outline-none" 
                  placeholder="e.g. 9876543210" 
                  value={newPhone} 
                  onChange={e => setNewPhone(e.target.value)} 
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase ml-1">Select Plan</label>
                <div className="grid gap-2 mt-1">
                  {plans.map(p => (
                    <button
                      key={p.id}
                      onClick={() => setSelectedPlanId(p.id)}
                      className={`p-4 rounded-xl border-2 text-left transition-all ${selectedPlanId === p.id ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-slate-200 dark:border-slate-700'}`}
                    >
                      <div className="flex justify-between items-center">
                        <span className={`font-bold ${selectedPlanId === p.id ? 'text-blue-700 dark:text-blue-400' : 'text-slate-700 dark:text-slate-300'}`}>{p.name}</span>
                        <span className="font-bold text-slate-900 dark:text-white">{formatCurrency(p.cost)}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-4 mt-8">
              <button onClick={() => setShowAddModal(false)} className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded-xl">Cancel</button>
              <button onClick={handleSaveCustomer} className="flex-1 py-4 bg-blue-600 text-white font-bold rounded-xl shadow-lg">Save Member</button>
            </div>
          </div>
        </div>
      )}

      {/* Meal Entry Modal */}
      {showMealModal && (
        <div className="absolute inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-3xl p-6 shadow-2xl border dark:border-slate-800">
             <h3 className="text-2xl font-extrabold mb-4 text-slate-800 dark:text-white">Record Meal</h3>
             
             <div className="space-y-4">
               {/* Menu Select */}
               <div>
                  <label className="text-xs font-bold text-slate-400 uppercase ml-1">Select Item</label>
                  <select 
                    value={selectedMenuItem}
                    onChange={(e) => setSelectedMenuItem(e.target.value)}
                    className="w-full p-4 mt-1 border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white rounded-xl text-lg focus:border-blue-500 outline-none"
                  >
                    {menuItems.map(m => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
               </div>

               {/* Portion & Quantity Row */}
               <div className="flex gap-4">
                 <div className="flex-1">
                    <label className="text-xs font-bold text-slate-400 uppercase ml-1">Portion</label>
                    <div className="flex mt-1 border-2 border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                       <button 
                         onClick={() => setPortion('half')}
                         className={`flex-1 py-3 font-bold ${portion === 'half' ? 'bg-orange-500 text-white' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}
                       >Half</button>
                       <button 
                         onClick={() => setPortion('full')}
                         className={`flex-1 py-3 font-bold ${portion === 'full' ? 'bg-orange-500 text-white' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}
                       >Full</button>
                    </div>
                 </div>
                 <div className="flex-1">
                    <label className="text-xs font-bold text-slate-400 uppercase ml-1">Quantity</label>
                    <div className="flex items-center mt-1">
                       <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="p-3 bg-slate-200 dark:bg-slate-800 rounded-l-xl border-y-2 border-l-2 border-slate-200 dark:border-slate-700 dark:text-white"><Minus size={20}/></button>
                       <div className="flex-1 text-center py-3 border-y-2 border-slate-200 dark:border-slate-700 font-bold text-lg dark:text-white">{quantity}</div>
                       <button onClick={() => setQuantity(quantity + 1)} className="p-3 bg-slate-200 dark:bg-slate-800 rounded-r-xl border-y-2 border-r-2 border-slate-200 dark:border-slate-700 dark:text-white"><Plus size={20}/></button>
                    </div>
                 </div>
               </div>

               {/* BILLING BREAKDOWN */}
               <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl space-y-2">
                   {mealsCovered > 0 && (
                     <div className="flex justify-between text-green-600 dark:text-green-400 font-medium">
                        <span>Covered by Plan</span>
                        <span>{mealsCovered} meals</span>
                     </div>
                   )}
                   {mealsPayable > 0 && (
                     <div className="flex justify-between text-red-500 dark:text-red-400 font-medium">
                        <span>Payable Now</span>
                        <span>{mealsPayable} x {formatCurrency(unitPrice)}</span>
                     </div>
                   )}
                  
                  <div className="h-px bg-slate-200 dark:bg-slate-700 my-2"></div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 dark:text-slate-400 font-bold">Add to Balance</span>
                    <span className="text-2xl font-extrabold text-slate-800 dark:text-white">
                      {formatCurrency(costPayable)}
                    </span>
                  </div>
               </div>
             </div>

             <div className="flex gap-4 mt-6">
                <button onClick={() => setShowMealModal(null)} className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded-xl">Cancel</button>
                <button onClick={handleConfirmMeal} className="flex-1 py-4 bg-orange-500 text-white font-bold rounded-xl shadow-lg">Confirm</button>
             </div>
          </div>
        </div>
      )}

      {/* Add Break Modal */}
      {showBreakModal && (
        <div className="absolute inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-3xl p-6 shadow-2xl border dark:border-slate-800">
            <h3 className="text-2xl font-extrabold mb-2 text-slate-800 dark:text-white">Add Leave</h3>
            <p className="text-slate-500 dark:text-slate-400 mb-6">This will extend the validity date.</p>
            
            <div className="space-y-4">
               <div>
                <label className="text-xs font-bold text-slate-400 uppercase ml-1">Days Absent</label>
                <input 
                  type="number"
                  className="w-full p-4 border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white rounded-xl text-3xl font-bold text-center focus:border-yellow-500 outline-none" 
                  value={breakDays} 
                  onChange={e => setBreakDays(e.target.value)} 
                />
              </div>
              <div className="flex flex-wrap gap-2 justify-center">
                {[1, 2, 3, 5, 7, 10].map(num => (
                  <button 
                    key={num} 
                    onClick={() => setBreakDays(num.toString())}
                    className="px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg font-bold text-slate-600 dark:text-slate-300"
                  >
                    +{num}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-4 mt-8">
              <button onClick={() => setShowBreakModal(null)} className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded-xl">Cancel</button>
              <button onClick={handleSaveBreak} className="flex-1 py-4 bg-yellow-500 text-white font-bold rounded-xl shadow-lg">Confirm</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// 4. Finance / Transactions
const FinanceView = ({ transactions, onAddTransaction }: { transactions: Transaction[], onAddTransaction: (t: Transaction) => void }) => {
  const [showModal, setShowModal] = useState(false);
  const [amount, setAmount] = useState('');
  const [desc, setDesc] = useState('');
  const [category, setCategory] = useState(GROCERY_CATEGORIES[0]);
  const [type, setType] = useState<TransactionType>(TransactionType.EXPENSE);

  const handleSave = () => {
    if (!amount || !desc) return;
    onAddTransaction({
      id: crypto.randomUUID(),
      type,
      amount: parseFloat(amount),
      description: desc,
      category: type === TransactionType.EXPENSE ? category : undefined,
      date: new Date().toISOString()
    });
    setShowModal(false);
    setAmount('');
    setDesc('');
  };

  return (
    <div className="h-full flex flex-col bg-slate-50 dark:bg-slate-950 p-4 pb-24">
      <h2 className="text-3xl font-extrabold mb-6 text-slate-800 dark:text-white">Money Log</h2>
      
      <div className="flex-1 overflow-y-auto space-y-3">
        {transactions.slice().reverse().filter(t => t.type !== TransactionType.USAGE).map(t => (
          <div key={t.id} className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex justify-between items-center">
             <div>
                <p className="font-bold text-lg text-slate-800 dark:text-white">{t.description}</p>
                <div className="flex gap-2">
                   <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">{formatDate(t.date)}</p>
                   {t.category && <span className="text-xs bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-500">{t.category}</span>}
                </div>
             </div>
             <span className={`font-bold text-xl ${t.type === TransactionType.EXPENSE ? 'text-red-500' : 'text-green-500'}`}>
               {t.type === TransactionType.EXPENSE ? '-' : '+'}{formatCurrency(t.amount)}
             </span>
          </div>
        ))}
      </div>

       <button 
        onClick={() => setShowModal(true)}
        className="absolute bottom-24 right-6 bg-slate-800 dark:bg-slate-700 text-white p-5 rounded-full shadow-xl active:scale-95 transition-transform"
      >
        <Plus size={32} />
      </button>

      {showModal && (
        <div className="absolute inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-3xl p-6 shadow-2xl border dark:border-slate-800">
            <h3 className="text-2xl font-extrabold mb-6 dark:text-white">Add Entry</h3>
            
            <div className="grid grid-cols-2 gap-3 mb-6">
              <button 
                onClick={() => setType(TransactionType.EXPENSE)} 
                className={`py-4 rounded-xl text-lg font-bold border-2 ${type === TransactionType.EXPENSE ? 'bg-red-50 dark:bg-red-900/30 border-red-500 text-red-600' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400'}`}
              >
                Expense
              </button>
              <button 
                onClick={() => setType(TransactionType.INCOME)} 
                className={`py-4 rounded-xl text-lg font-bold border-2 ${type === TransactionType.INCOME ? 'bg-green-50 dark:bg-green-900/30 border-green-500 text-green-600' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400'}`}
              >
                Income
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase ml-1">Amount (₹)</label>
                <input 
                  type="number"
                  className="w-full p-4 border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white rounded-xl text-2xl font-bold" 
                  placeholder="0" 
                  value={amount} 
                  onChange={e => setAmount(e.target.value)} 
                />
              </div>
              
              {type === TransactionType.EXPENSE && (
                <div>
                   <label className="text-xs font-bold text-slate-400 uppercase ml-1">Category (Groceries etc)</label>
                   <select 
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full p-4 border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white rounded-xl text-lg outline-none"
                   >
                     {GROCERY_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                   </select>
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-slate-400 uppercase ml-1">For What?</label>
                <input 
                  className="w-full p-4 border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white rounded-xl text-lg" 
                  placeholder="e.g. Tomatoes, Salary" 
                  value={desc} 
                  onChange={e => setDesc(e.target.value)} 
                />
              </div>
            </div>
            <div className="flex gap-4 mt-8">
              <button onClick={() => setShowModal(false)} className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 font-bold text-slate-600 dark:text-slate-300 rounded-xl">Cancel</button>
              <button onClick={handleSave} className="flex-1 py-4 bg-slate-800 dark:bg-slate-700 text-white font-bold rounded-xl shadow-lg">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// 5. Settings / Menu
const SettingsView = ({ 
  onLogout, 
  onExport, 
  settings, 
  darkMode,
  onUpdateSettings,
  onToggleDarkMode
}: { 
  onLogout: () => void, 
  onExport: () => void,
  settings: ReminderSettings,
  darkMode: boolean,
  onUpdateSettings: (s: ReminderSettings) => void,
  onToggleDarkMode: () => void
}) => {
  
  const updateDays = (val: number) => {
    onUpdateSettings({ ...settings, subscriptionDays: Math.max(1, val) });
  };
  
  const updateBalance = (val: number) => {
    onUpdateSettings({ ...settings, balanceThreshold: Math.max(0, val) });
  };
  
  const updateMeals = (val: number) => {
    onUpdateSettings({ ...settings, mealThreshold: Math.max(0, val) });
  };

  return (
    <div className="p-6 pb-24 h-full overflow-y-auto bg-slate-50 dark:bg-slate-950">
      <h2 className="text-3xl font-extrabold mb-8 text-slate-800 dark:text-white">Settings</h2>
      
      <div className="space-y-6">
        {/* Dark Mode Toggle */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-4">
             <div className={`p-3 rounded-full ${darkMode ? 'bg-slate-800 text-yellow-400' : 'bg-slate-100 text-slate-500'}`}>
                {darkMode ? <Moon size={24} /> : <Sun size={24} />}
             </div>
             <div>
               <p className="font-bold text-lg text-slate-800 dark:text-white">Dark Mode</p>
               <p className="text-sm text-slate-500 dark:text-slate-400">Easy on the eyes</p>
             </div>
          </div>
          <button 
             onClick={onToggleDarkMode}
             className={`w-14 h-8 rounded-full p-1 transition-colors ${darkMode ? 'bg-blue-600' : 'bg-slate-300'}`}
          >
             <div className={`w-6 h-6 bg-white rounded-full shadow-md transition-transform ${darkMode ? 'translate-x-6' : ''}`} />
          </button>
        </div>

        {/* Reminders Section */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
           <h3 className="font-bold text-lg mb-6 text-slate-800 dark:text-white flex items-center gap-2">
             <Bell size={20} /> Reminders
           </h3>
           
           <div className="space-y-6">
             <div>
               <label className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase mb-2 block">Alert before Expiry</label>
               <div className="flex items-center gap-4">
                 <button onClick={() => updateDays(settings.subscriptionDays - 1)} className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl font-bold dark:text-white">-</button>
                 <span className="flex-1 text-center font-bold text-xl dark:text-white">{settings.subscriptionDays} Days</span>
                 <button onClick={() => updateDays(settings.subscriptionDays + 1)} className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl font-bold dark:text-white">+</button>
               </div>
             </div>

             <div>
               <label className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase mb-2 block">Low Meal Alert</label>
               <div className="flex items-center gap-4">
                 <button onClick={() => updateMeals(settings.mealThreshold - 1)} className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl font-bold dark:text-white">-</button>
                 <span className="flex-1 text-center font-bold text-xl dark:text-white">{settings.mealThreshold} Meals</span>
                 <button onClick={() => updateMeals(settings.mealThreshold + 1)} className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl font-bold dark:text-white">+</button>
               </div>
             </div>
             
             <div>
               <label className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase mb-2 block">Postpaid Limit Alert</label>
               <div className="flex items-center gap-4">
                 <button onClick={() => updateBalance(settings.balanceThreshold - 100)} className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl font-bold dark:text-white">-</button>
                 <span className="flex-1 text-center font-bold text-xl dark:text-white">₹ {settings.balanceThreshold}</span>
                 <button onClick={() => updateBalance(settings.balanceThreshold + 100)} className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl font-bold dark:text-white">+</button>
               </div>
             </div>
           </div>
        </div>

        {/* Actions */}
        <button onClick={onExport} className="w-full bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm text-left flex items-center gap-6 active:bg-slate-50 dark:active:bg-slate-800 transition border border-slate-200 dark:border-slate-800">
          <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-xl text-blue-600 dark:text-blue-400"><ArrowDownLeft size={32} /></div>
          <div>
            <p className="font-bold text-xl text-slate-800 dark:text-white">Save Data (Backup)</p>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Download to Phone</p>
          </div>
        </button>
        
        <div className="pt-4">
          <button onClick={onLogout} className="w-full bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 p-5 rounded-2xl font-bold text-xl flex justify-center items-center gap-3 border border-red-100 dark:border-red-900/30">
            <LogOut size={24} /> Logout
          </button>
        </div>
        
        <div className="mt-4 text-center">
          <p className="text-sm font-bold text-slate-400 uppercase">MessMate v2.3</p>
        </div>
      </div>
    </div>
  );
};

// --- MAIN APP COMPONENT ---

enum Screen {
  DASHBOARD,
  CUSTOMERS,
  FINANCE,
  SETTINGS
}

export default function App() {
  const [state, setState] = useState<AppState>(loadState());
  const [screen, setScreen] = useState<Screen>(Screen.DASHBOARD);

  // Persistence Effect
  useEffect(() => {
    saveState(state);
  }, [state]);

  const handleLogin = (user: User) => {
    setState(prev => ({ ...prev, currentUser: user }));
  };

  const handleLogout = () => {
    setState(prev => ({ ...prev, currentUser: null }));
    setScreen(Screen.DASHBOARD);
  };

  const addCustomer = (customer: Customer) => {
    setState(prev => ({
      ...prev,
      customers: [...prev.customers, customer],
      // Add initial transaction for subscription
      transactions: [...prev.transactions, {
        id: crypto.randomUUID(),
        type: TransactionType.SUBSCRIPTION,
        amount: state.plans.find(p => p.id === customer.planId)?.cost || 0,
        date: new Date().toISOString(),
        description: `New Plan: ${customer.name}`,
        customerId: customer.id
      }]
    }));
  };

  const addTransaction = (transaction: Transaction) => {
    setState(prev => ({
      ...prev,
      transactions: [...prev.transactions, transaction]
    }));
  };

  const markMeal = (customerId: string, item: MenuItem, portion: 'half'|'full', quantity: number) => {
    const unitPrice = portion === 'full' ? item.priceFull : item.priceHalf;
    const desc = `${item.name} (${portion}) x${quantity}`;

    setState(prev => {
      const customer = prev.customers.find(c => c.id === customerId);
      if (!customer) return prev;

      // Logic: Prioritize meals from plan
      const mealsLeft = customer.mealsRemaining;
      const mealsCovered = Math.min(mealsLeft, quantity);
      const mealsPayable = quantity - mealsCovered;
      const costPayable = mealsPayable * unitPrice;

      const newTransactions: Transaction[] = [];

      // 1. Log Plan Usage (0 Cost)
      if (mealsCovered > 0) {
        newTransactions.push({
          id: crypto.randomUUID(),
          type: TransactionType.USAGE,
          amount: 0,
          date: new Date().toISOString(),
          description: `${desc} (Plan)`,
          customerId: customerId,
          category: 'Meal Plan'
        });
      }

      // 2. Log Payable Amount (If plan empty or exceeded)
      if (costPayable > 0) {
        newTransactions.push({
          id: crypto.randomUUID(),
          type: TransactionType.INCOME,
          amount: costPayable,
          date: new Date().toISOString(),
          description: `${desc} (Extra)`,
          customerId: customerId,
          category: 'Meal Extra'
        });
      }

      return {
        ...prev,
        customers: prev.customers.map(c => {
          if (c.id === customerId) {
            return { 
              ...c, 
              mealsRemaining: c.mealsRemaining - mealsCovered, 
              balance: c.balance + costPayable 
            };
          }
          return c;
        }),
        transactions: [...prev.transactions, ...newTransactions]
      };
    });
  };

  const addBreak = (customerId: string, days: number) => {
    setState(prev => ({
      ...prev,
      customers: prev.customers.map(c => {
        if (c.id === customerId) {
          const currentExpiry = new Date(c.expiryDate);
          const newExpiry = new Date(currentExpiry);
          newExpiry.setDate(newExpiry.getDate() + days);
          
          return { 
            ...c, 
            expiryDate: newExpiry.toISOString(),
            totalBreakDays: (c.totalBreakDays || 0) + days
          };
        }
        return c;
      })
    }));
  };

  const updateSettings = (newSettings: ReminderSettings) => {
    setState(prev => ({ ...prev, settings: newSettings }));
  };

  const toggleDarkMode = () => {
    setState(prev => ({ ...prev, darkMode: !prev.darkMode }));
  };

  // Render logic
  if (!state.currentUser) {
    return (
      <div className={state.darkMode ? "dark" : ""}>
        <AuthScreen onLogin={handleLogin} />
      </div>
    );
  }

  return (
    <div className={state.darkMode ? "dark" : ""}>
      <div className="h-screen w-full flex flex-col bg-slate-100 dark:bg-slate-950 relative font-sans text-slate-900 dark:text-white transition-colors duration-200">
        <div className="flex-1 overflow-hidden relative">
          {screen === Screen.DASHBOARD && (
            <Dashboard 
              customers={state.customers} 
              transactions={state.transactions}
              settings={state.settings}
              onScanMeal={() => setScreen(Screen.CUSTOMERS)}
            />
          )}
          {screen === Screen.CUSTOMERS && (
            <CustomerList 
              customers={state.customers} 
              plans={state.plans}
              menuItems={state.menuItems}
              onAddCustomer={addCustomer}
              onMarkMeal={markMeal}
              onAddBreak={addBreak}
            />
          )}
          {screen === Screen.FINANCE && (
            <FinanceView 
              transactions={state.transactions}
              onAddTransaction={addTransaction}
            />
          )}
          {screen === Screen.SETTINGS && (
            <SettingsView 
              onLogout={handleLogout}
              onExport={() => exportDataToCSV(state.transactions, state.customers)}
              settings={state.settings}
              darkMode={state.darkMode}
              onUpdateSettings={updateSettings}
              onToggleDarkMode={toggleDarkMode}
            />
          )}
        </div>

        {/* Bottom Navigation */}
        <nav className="h-24 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex justify-around items-center absolute bottom-0 w-full z-40 pb-4 shadow-[0_-10px_40px_rgba(0,0,0,0.1)]">
          <NavButton 
            icon={<LayoutDashboard size={28} />} 
            label="Home" 
            isActive={screen === Screen.DASHBOARD} 
            onClick={() => setScreen(Screen.DASHBOARD)} 
          />
          <NavButton 
            icon={<Users size={28} />} 
            label="Members" 
            isActive={screen === Screen.CUSTOMERS} 
            onClick={() => setScreen(Screen.CUSTOMERS)} 
          />
          <NavButton 
            icon={<Wallet size={28} />} 
            label="Money" 
            isActive={screen === Screen.FINANCE} 
            onClick={() => setScreen(Screen.FINANCE)} 
          />
          <NavButton 
            icon={<Settings size={28} />} 
            label="Tools" 
            isActive={screen === Screen.SETTINGS} 
            onClick={() => setScreen(Screen.SETTINGS)} 
          />
        </nav>
      </div>
    </div>
  );
}

const NavButton = ({ icon, label, isActive, onClick }: any) => (
  <button 
    onClick={onClick} 
    className={`flex flex-col items-center justify-center p-2 rounded-2xl w-20 transition-all duration-200 ${isActive ? 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 -translate-y-2' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
  >
    {icon}
    <span className="text-xs font-bold mt-1 uppercase tracking-wide">{label}</span>
  </button>
);