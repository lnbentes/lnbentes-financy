import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import { financeService } from '../../services/finance';
import { extractArray } from '../../utils/helpers';
import { Logger } from '../../utils/logger';
import type { 
  Transaction, 
  Account, 
  Category, 
  MonthlySummary 
} from '../../types/finance';

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
  summary: MonthlySummary;
  transactions: Transaction[];
  accounts: Account[];
  categories: Category[];
  
  loadData: () => Promise<void>;

  isTransactionModalOpen: boolean;
  setTransactionModalOpen: (b: boolean) => void;
  selectedTransaction: Transaction | null;
  setSelectedTransaction: (t: Transaction | null) => void;

  isAccountModalOpen: boolean;
  setAccountModalOpen: (b: boolean) => void;
  selectedAccount: Account | null;
  setSelectedAccount: (a: Account | null) => void;

  isCategoryModalOpen: boolean;
  setCategoryModalOpen: (b: boolean) => void;
  selectedCategory: Category | null;
  setSelectedCategory: (c: Category | null) => void;

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
  const [summary, setSummary] = useState<MonthlySummary>({ income: 0, expense: 0, balance: 0, category_breakdown: [] });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  const [isTransactionModalOpen, setTransactionModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

  const [isAccountModalOpen, setAccountModalOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);

  const [isCategoryModalOpen, setCategoryModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

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

      setSummary(summaryRes || { income: 0, expense: 0, balance: 0, category_breakdown: [] });
      setTransactions(extractArray(transactionsRes));
      setAccounts(extractArray(accountsRes));
      setCategories(extractArray(categoriesRes));
    } catch (err: unknown) {
      Logger.error('Erro ao carregar dados financeiros', err);
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
