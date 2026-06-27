import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import { financeService } from '../../services/finance';
import { extractArray } from '../../utils/helpers';

interface FinanceContextType {
  month: number;
  year: number;
  setMonth: (m: number) => void;
  setYear: (y: number) => void;
  
  search: string;
  setSearch: (s: string) => void;
  txType: string;
  setTxType: (t: string) => void;
  
  loading: boolean;
  summary: any;
  transactions: any[];
  accounts: any[];
  categories: any[];
  
  loadData: () => Promise<void>;

  isTransactionModalOpen: boolean;
  setTransactionModalOpen: (b: boolean) => void;
  selectedTransaction: any;
  setSelectedTransaction: (t: any) => void;

  isAccountModalOpen: boolean;
  setAccountModalOpen: (b: boolean) => void;
  selectedAccount: any;
  setSelectedAccount: (a: any) => void;

  isCategoryModalOpen: boolean;
  setCategoryModalOpen: (b: boolean) => void;
  selectedCategory: any;
  setSelectedCategory: (c: any) => void;

  isDataModalOpen: boolean;
  setDataModalOpen: (b: boolean) => void;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export function FinanceProvider({ children }: { children: ReactNode }) {
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  
  const [search, setSearch] = useState('');
  const [txType, setTxType] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<any>({ income: 0, expense: 0, balance: 0, category_breakdown: [] });
  const [transactions, setTransactions] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);

  const [isTransactionModalOpen, setTransactionModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);

  const [isAccountModalOpen, setAccountModalOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<any>(null);

  const [isCategoryModalOpen, setCategoryModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<any>(null);

  const [isDataModalOpen, setDataModalOpen] = useState(false);


  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const filters = { year, month, search, type: txType };

      const [summaryRes, transactionsRes, accountsRes, categoriesRes] = await Promise.all([
        financeService.transactions.summary({ year, month }),
        financeService.transactions.list(filters),
        financeService.accounts.list(),
        financeService.categories.list()
      ]);

      setSummary(summaryRes?.data || summaryRes || { income: 0, expense: 0, balance: 0, category_breakdown: [] });
      setTransactions(extractArray(transactionsRes));
      setAccounts(extractArray(accountsRes));
      setCategories(extractArray(categoriesRes));
    } catch (err) {
      console.error('Error loading finance data', err);
    } finally {
      setLoading(false);
    }
  }, [month, year, search, txType]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <FinanceContext.Provider value={{
      month, year, setMonth, setYear,
      search, setSearch, txType, setTxType,
      loading, summary, transactions, accounts, categories,
      loadData,
      isTransactionModalOpen, setTransactionModalOpen, selectedTransaction, setSelectedTransaction,
      isAccountModalOpen, setAccountModalOpen, selectedAccount, setSelectedAccount,
      isCategoryModalOpen, setCategoryModalOpen, selectedCategory, setSelectedCategory,
      isDataModalOpen, setDataModalOpen
    }}>
      {children}
    </FinanceContext.Provider>
  );
}

export function useFinance() {
  const context = useContext(FinanceContext);
  if (context === undefined) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return context;
}
