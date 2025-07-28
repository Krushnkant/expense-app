import React, { createContext, useContext, useReducer, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Transaction, Category, EMI, User, MonthlyStats, CategoryStats, Toast } from '@/types';
import { useAuth } from '@/contexts/AuthContext';

interface AppState {
  user: User | null;
  transactions: Transaction[];
  categories: Category[];
  emis: EMI[];
  isLoading: boolean;
  monthlyStats: MonthlyStats;
  categoryStats: CategoryStats[];
  currentToast: Toast | null;
}

type AppAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_USER'; payload: User | null }
  | { type: 'SET_TRANSACTIONS'; payload: Transaction[] }
  | { type: 'ADD_TRANSACTION'; payload: Transaction }
  | { type: 'UPDATE_TRANSACTION'; payload: Transaction }
  | { type: 'DELETE_TRANSACTION'; payload: string }
  | { type: 'SET_CATEGORIES'; payload: Category[] }
  | { type: 'ADD_CATEGORY'; payload: Category }
  | { type: 'UPDATE_CATEGORY'; payload: Category }
  | { type: 'SET_EMIS'; payload: EMI[] }
  | { type: 'ADD_EMI'; payload: EMI }
  | { type: 'UPDATE_EMI'; payload: EMI }
  | { type: 'DELETE_EMI'; payload: string }
  | { type: 'SET_MONTHLY_STATS'; payload: MonthlyStats }
  | { type: 'SET_CATEGORY_STATS'; payload: CategoryStats[] }
  | { type: 'SHOW_TOAST'; payload: Toast }
  | { type: 'HIDE_TOAST' };

const initialState: AppState = {
  user: null,
  transactions: [],
  categories: [],
  emis: [],
  isLoading: true,
  monthlyStats: {
    totalIncome: 0,
    totalExpenses: 0,
    netSavings: 0,
    budgetUsed: 0,
    transactionCount: 0,
  },
  categoryStats: [],
  currentToast: null,
};

const defaultCategories: Category[] = [
  // Expense Categories
  { id: '1', name: 'Food & Dining', type: 'expense', color: '#EF4444', icon: 'Utensils', scopes: ['personal', 'family'], isDefault: true },
  { id: '2', name: 'Transportation', type: 'expense', color: '#3B82F6', icon: 'Car', scopes: ['personal', 'family'], isDefault: true },
  { id: '3', name: 'Shopping', type: 'expense', color: '#8B5CF6', icon: 'ShoppingBag', scopes: ['personal', 'family'], isDefault: true },
  { id: '4', name: 'Entertainment', type: 'expense', color: '#F59E0B', icon: 'Tv', scopes: ['personal', 'family'], isDefault: true },
  { id: '5', name: 'Bills & Utilities', type: 'expense', color: '#4facfe', icon: 'Receipt', scopes: ['personal', 'family'], isDefault: true },
  { id: '6', name: 'Healthcare', type: 'expense', color: '#EF4444', icon: 'Heart', scopes: ['personal', 'family'], isDefault: true },
  { id: '7', name: 'Education', type: 'expense', color: '#6366F1', icon: 'Book', scopes: ['personal', 'family'], isDefault: true },
  { id: '8', name: 'Personal Care', type: 'expense', color: '#EC4899', icon: 'Sparkles', scopes: ['personal', 'family'], isDefault: true },
  { id: '9', name: 'Travel', type: 'expense', color: '#10B981', icon: 'Plane', scopes: ['personal', 'family'], isDefault: true },
  { id: '10', name: 'Groceries', type: 'expense', color: '#059669', icon: 'ShoppingCart', scopes: ['personal', 'family'], isDefault: true },
  { id: '11', name: 'Other', type: 'expense', color: '#6B7280', icon: 'MoreHorizontal', scopes: ['personal', 'family'], isDefault: true },
  
  // Income Categories
  { id: '12', name: 'Salary', type: 'income', color: '#4facfe', icon: 'Briefcase', scopes: ['personal', 'family'], isDefault: true },
  { id: '13', name: 'Freelance', type: 'income', color: '#2563EB', icon: 'Laptop', scopes: ['personal', 'family'], isDefault: true },
  { id: '14', name: 'Investment', type: 'income', color: '#1D4ED8', icon: 'TrendingUp', scopes: ['personal', 'family'], isDefault: true },
  { id: '15', name: 'Business', type: 'income', color: '#059669', icon: 'Building', scopes: ['personal', 'family'], isDefault: true },
  { id: '16', name: 'Bonus', type: 'income', color: '#DC2626', icon: 'Gift', scopes: ['personal', 'family'], isDefault: true },
  { id: '17', name: 'Other Income', type: 'income', color: '#6B7280', icon: 'MoreHorizontal', scopes: ['personal', 'family'], isDefault: true },
];

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_USER':
      return { ...state, user: action.payload };
    case 'SET_TRANSACTIONS':
      return { ...state, transactions: action.payload };
    case 'ADD_TRANSACTION':
      return { ...state, transactions: [action.payload, ...state.transactions] };
    case 'UPDATE_TRANSACTION':
      return {
        ...state,
        transactions: state.transactions.map(t =>
          t.id === action.payload.id ? action.payload : t
        ),
      };
    case 'DELETE_TRANSACTION':
      return {
        ...state,
        transactions: state.transactions.filter(t => t.id !== action.payload),
      };
    case 'SET_CATEGORIES':
      return { ...state, categories: action.payload };
    case 'ADD_CATEGORY':
      return { ...state, categories: [...state.categories, action.payload] };
    case 'UPDATE_CATEGORY':
      return {
        ...state,
        categories: state.categories.map(c =>
          c.id === action.payload.id ? action.payload : c
        ),
      };
    case 'SET_EMIS':
      return { ...state, emis: action.payload };
    case 'ADD_EMI':
      return { ...state, emis: [...state.emis, action.payload] };
    case 'UPDATE_EMI':
      return {
        ...state,
        emis: state.emis.map(e => (e.id === action.payload.id ? action.payload : e)),
      };
    case 'DELETE_EMI':
      return {
        ...state,
        emis: state.emis.filter(e => e.id !== action.payload),
      };
    case 'SET_MONTHLY_STATS':
      return { ...state, monthlyStats: action.payload };
    case 'SET_CATEGORY_STATS':
      return { ...state, categoryStats: action.payload };
    case 'SHOW_TOAST':
      return { ...state, currentToast: action.payload };
    case 'HIDE_TOAST':
      return { ...state, currentToast: null };
    default:
      return state;
  }
}

const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  addTransaction: (transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateTransaction: (transaction: Transaction) => void;
  deleteTransaction: (id: string) => void;
  addCategory: (category: Omit<Category, 'id'>) => void;
  updateCategory: (category: Category) => void;
  addEMI: (emi: Omit<EMI, 'id'>) => void;
  updateEMI: (emi: EMI) => void;
  deleteEMI: (id: string) => void;
  deleteCategory: (id: string) => void;
  updateUserCurrency: (currency: string) => void;
  calculateStats: () => void;
  showToast: (toast: Toast) => void;
  hideToast: () => void;
  getCategories: (type?: 'expense' | 'income') => Category[];
  getPersonalCategories: (type?: 'expense' | 'income') => Category[];
  getFamilyCategories: (type?: 'expense' | 'income') => Category[];
} | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const { state: authState } = useAuth();

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    calculateStats();
  }, [state.transactions]);

  // Update user from auth state
  useEffect(() => {
    if (authState.user) {
      // Convert AuthUser to User format for AppContext
      const appUser: User = {
        id: authState.user.id,
        name: authState.user.name,
        email: authState.user.email,
        mobile: authState.user.mobile,
        currency: 'USD',
        monthlyBudget: 3000, // Default budget
        createdAt: authState.user.createdAt,
        avatar: authState.user.avatar,
        isEmailVerified: authState.user.isEmailVerified,
        isMobileVerified: authState.user.isMobileVerified,
      };
      dispatch({ type: 'SET_USER', payload: appUser });
    } else {
      // Set default user for guest mode
      const defaultUser: User = {
        id: 'guest',
        name: 'Guest User',
        currency: 'INR',
        monthlyBudget: 3000,
        createdAt: new Date().toISOString(),
      };
      dispatch({ type: 'SET_USER', payload: defaultUser });
    }
  }, [authState.user]);

  const loadData = async () => {
    try {
      const [transactionsData, categoriesData, emisData] = await Promise.all([
        AsyncStorage.getItem('transactions'),
        AsyncStorage.getItem('categories'),
        AsyncStorage.getItem('emis'),
      ]);

      if (transactionsData) {
        dispatch({ type: 'SET_TRANSACTIONS', payload: JSON.parse(transactionsData) });
      }

      if (categoriesData) {
        const savedCategories = JSON.parse(categoriesData);
        // Migrate existing categories to ensure they have proper scopes
        const migratedCategories = savedCategories.map((cat: any) => ({
          ...cat,
          scopes: cat.scopes || ['family'], // Keep existing scopes or default to family
          isDefault: cat.isDefault || false, // Ensure isDefault is set
        }));
        
        // Deduplicate categories by ID to prevent React key conflicts
        const uniqueCategories = migratedCategories.filter((category: Category, index: number, self: Category[]) => 
          index === self.findIndex(c => c.id === category.id)
        );
        
        dispatch({ type: 'SET_CATEGORIES', payload: uniqueCategories });
        
        // Save migrated categories back to storage
        await AsyncStorage.setItem('categories', JSON.stringify(uniqueCategories));
      } else {
        dispatch({ type: 'SET_CATEGORIES', payload: defaultCategories });
        await AsyncStorage.setItem('categories', JSON.stringify(defaultCategories));
      }

      if (emisData) {
        dispatch({ type: 'SET_EMIS', payload: JSON.parse(emisData) });
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const addTransaction = async (transactionData: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) => {
    const transaction: Transaction = {
      ...transactionData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    dispatch({ type: 'ADD_TRANSACTION', payload: transaction });
    
    const updatedTransactions = [transaction, ...state.transactions];
    await AsyncStorage.setItem('transactions', JSON.stringify(updatedTransactions));
  };

  const updateTransaction = async (transaction: Transaction) => {
    const updatedTransaction = { ...transaction, updatedAt: new Date().toISOString() };
    dispatch({ type: 'UPDATE_TRANSACTION', payload: updatedTransaction });
    
    const updatedTransactions = state.transactions.map(t =>
      t.id === transaction.id ? updatedTransaction : t
    );
    await AsyncStorage.setItem('transactions', JSON.stringify(updatedTransactions));
  };

  const deleteTransaction = async (id: string) => {
    dispatch({ type: 'DELETE_TRANSACTION', payload: id });
    
    const updatedTransactions = state.transactions.filter(t => t.id !== id);
    await AsyncStorage.setItem('transactions', JSON.stringify(updatedTransactions));
  };

  const addCategory = async (categoryData: Omit<Category, 'id'>) => {
    const category: Category = {
      ...categoryData,
      id: Date.now().toString() + Math.random().toString(36).substring(2),
      scopes: categoryData.scopes || ['family'], // Use provided scopes or default to family
      isDefault: false, // User-created categories are never default
    };

    dispatch({ type: 'ADD_CATEGORY', payload: category });
    
    const updatedCategories = [...state.categories, category];
    await AsyncStorage.setItem('categories', JSON.stringify(updatedCategories));
  };

  const updateCategory = async (category: Category) => {
    // Prevent updating default categories
    if (category.isDefault) {
      throw new Error('Default categories cannot be modified');
    }
    
    // Keep existing scopes for user categories
    const updatedCategory = {
      ...category,
      isDefault: false, // Ensure user categories remain non-default
    };
    
    dispatch({ type: 'UPDATE_CATEGORY', payload: updatedCategory });
    
    const updatedCategories = state.categories.map(c =>
      c.id === category.id ? updatedCategory : c
    );
    await AsyncStorage.setItem('categories', JSON.stringify(updatedCategories));
  };

  const addEMI = async (emiData: Omit<EMI, 'id'>) => {
    const emi: EMI = {
      ...emiData,
      id: Date.now().toString(),
    };

    dispatch({ type: 'ADD_EMI', payload: emi });
    
    const updatedEMIs = [...state.emis, emi];
    await AsyncStorage.setItem('emis', JSON.stringify(updatedEMIs));
  };

  const updateEMI = async (emi: EMI) => {
    const updatedEMI = { ...emi, updatedAt: new Date().toISOString() };
    dispatch({ type: 'UPDATE_EMI', payload: emi });
    
    const updatedEMIs = state.emis.map(e => (e.id === emi.id ? emi : e));
    await AsyncStorage.setItem('emis', JSON.stringify(updatedEMIs));
  };

  const deleteEMI = async (id: string) => {
    dispatch({ type: 'DELETE_EMI', payload: id });
    
    const updatedEMIs = state.emis.filter(e => e.id !== id);
    await AsyncStorage.setItem('emis', JSON.stringify(updatedEMIs));
  };

  const calculateStats = () => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    const currentMonthTransactions = state.transactions.filter(t => {
      const transactionDate = new Date(t.date);
      return transactionDate.getMonth() === currentMonth && transactionDate.getFullYear() === currentYear;
    });

    const totalIncome = currentMonthTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpenses = currentMonthTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const netSavings = totalIncome - totalExpenses;
    const budgetUsed = state.user ? (totalExpenses / state.user.monthlyBudget) * 100 : 0;

    const monthlyStats: MonthlyStats = {
      totalIncome,
      totalExpenses,
      netSavings,
      budgetUsed,
      transactionCount: currentMonthTransactions.length,
    };

    dispatch({ type: 'SET_MONTHLY_STATS', payload: monthlyStats });

    // Calculate category stats
    const expensesByCategory = currentMonthTransactions
      .filter(t => t.type === 'expense')
      .reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + t.amount;
        return acc;
      }, {} as Record<string, number>);

    const categoryStats: CategoryStats[] = Object.entries(expensesByCategory).map(([category, amount]) => {
      const categoryInfo = state.categories.find(c => c.name === category);
      return {
        category,
        amount,
        percentage: totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0,
        color: categoryInfo?.color || '#6B7280',
        transactionCount: currentMonthTransactions.filter(t => t.category === category).length,
      };
    }).sort((a, b) => b.amount - a.amount);

    dispatch({ type: 'SET_CATEGORY_STATS', payload: categoryStats });
  };

  const showToast = (toast: Toast) => {
    dispatch({ type: 'SHOW_TOAST', payload: toast });
  };

  const hideToast = () => {
    dispatch({ type: 'HIDE_TOAST' });
  };

  // Enhanced category retrieval with scope filtering
  const getCategories = (type?: 'expense' | 'income', scope?: 'personal' | 'family') => {
    let categories = state.categories;
    
    // Filter by scope if provided
    if (scope) {
      categories = categories.filter(c => c.scopes.includes(scope));
    }
    
    // Filter by type if provided
    if (type) {
      categories = categories.filter(c => c.type === type);
    }
    
    return categories;
  };

  // Specific methods for personal and family categories
  const getPersonalCategories = (type?: 'expense' | 'income') => {
    return getCategories(type, 'personal');
  };

  const getFamilyCategories = (type?: 'expense' | 'income') => {
    return getCategories(type, 'family');
  };

  const deleteCategory = async (id: string) => {
    const categoryToDelete = state.categories.find(c => c.id === id);
    
    // Prevent deleting default categories
    if (categoryToDelete?.isDefault) {
      throw new Error('Default categories cannot be deleted');
    }
    
    const updatedCategories = state.categories.filter(c => c.id !== id);
    dispatch({ type: 'SET_CATEGORIES', payload: updatedCategories });
    await AsyncStorage.setItem('categories', JSON.stringify(updatedCategories));
  };

  const updateUserCurrency = async (currency: string) => {
    if (state.user) {
      const updatedUser = { ...state.user, currency };
      dispatch({ type: 'SET_USER', payload: updatedUser });
      
      // Save to AsyncStorage if it's a registered user
      if (authState.user) {
        try {
          const userData = await AsyncStorage.getItem('userData');
          if (userData) {
            const parsedUserData = JSON.parse(userData);
            const updatedUserData = { ...parsedUserData, currency };
            await AsyncStorage.setItem('userData', JSON.stringify(updatedUserData));
          }
        } catch (error) {
          console.error('Error saving currency preference:', error);
        }
      }
    }
  };

  return (
    <AppContext.Provider
      value={{
        state,
        dispatch,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        addCategory,
        updateCategory,
        addEMI,
        updateEMI,
        deleteEMI,
        calculateStats,
        showToast,
        hideToast,
        getCategories,
        getPersonalCategories,
        getFamilyCategories,
        deleteCategory,
        updateUserCurrency,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};