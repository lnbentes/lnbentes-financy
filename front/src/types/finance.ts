export type TransactionType = 'INCOME' | 'EXPENSE' | 'TRANSFER';
export type PaymentMethod = 'CREDIT' | 'DEBIT' | 'CASH' | 'PIX' | 'INSTALLMENT' | 'BOLETO';
export type AccountType = 'BANK' | 'WALLET' | 'INVESTMENT' | 'CREDIT' | 'OTHER';
export type CategoryType = 'INCOME' | 'EXPENSE' | 'BOTH';
export type RecurringFrequency = 'MONTHLY' | 'WEEKLY' | 'YEARLY';
export type BudgetStatus = 'OK' | 'WARNING' | 'EXCEEDED';

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: CategoryType;
}

export interface Account {
  id: string;
  name: string;
  balance: number;
  type: AccountType;
  color: string;
  icon: string;
  pending_installments_amount?: number;
  pending_installments_months?: number;
}

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: TransactionType;
  method: PaymentMethod;
  category?: string | null;
  category_name?: string | null;
  category_color?: string | null;
  category_icon?: string | null;
  account: string;
  account_name?: string;
  account_color?: string;
  account_icon?: string;
  to_account?: string | null;
  to_account_name?: string | null;
  date: string;
  purchase_date?: string | null;
  installment_current?: number | null;
  installment_total?: number | null;
  installment_id_group?: string | null;
  balance_applied: boolean;
}

export interface Budget {
  id: string;
  category: string;
  category_name?: string;
  category_icon?: string;
  category_color?: string;
  amount_limit: number;
  month: number;
  year: number;
  created_at?: string;
  updated_at?: string;
}

export interface BudgetSummary {
  id: string;
  category_id: string;
  category_name: string;
  category_icon: string;
  category_color: string;
  amount_limit: number;
  spent_amount: number;
  remaining_amount: number;
  percentage_spent: number;
  status: BudgetStatus;
  month: number;
  year: number;
}

export interface RecurringTransaction {
  id: string;
  description: string;
  amount: number;
  type: TransactionType;
  method: PaymentMethod;
  category?: string | null;
  category_name?: string | null;
  category_icon?: string | null;
  category_color?: string | null;
  account: string;
  account_name?: string;
  account_color?: string;
  frequency: RecurringFrequency;
  day_of_month: number;
  month_of_year?: number | null;
  is_active: boolean;
  last_processed_date?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface CategoryBreakdown {
  name: string;
  color: string;
  icon: string;
  total: number;
}

export interface MonthlySummary {
  income: number;
  expense: number;
  balance: number;
  category_breakdown?: CategoryBreakdown[];
  label?: string;
}

export interface TransactionFilters {
  search?: string;
  account?: string;
  category?: string;
  type?: string;
  method?: string;
  startDate?: string;
  endDate?: string;
}

export interface DataExportFilters {
  account_ids?: string | string[];
  year?: number;
  month?: number;
}

export interface DataImportResult {
  message?: string;
  accounts_created?: number;
  categories_created?: number;
  transactions_created?: number;
  imported_accounts?: number;
  imported_categories?: number;
  imported_transactions?: number;
  errors?: string[];
}

export interface InstallmentItem {
  id: string;
  description: string;
  amount: number;
  date: string;
  purchase_date?: string | null;
  installment_current: number;
  installment_total: number;
  is_paid: boolean;
  balance_applied: boolean;
}

export interface InstallmentGroup {
  group_id: string;
  description: string;
  purchase_date?: string | null;
  account_id?: string | null;
  account_name?: string;
  account_color?: string;
  category_id?: string | null;
  category_name?: string;
  category_color?: string;
  category_icon?: string;
  installment_total: number;
  paid_count: number;
  remaining_count: number;
  total_amount: number;
  paid_amount: number;
  remaining_amount: number;
  first_date: string;
  last_date: string;
  status: 'ACTIVE' | 'PAID';
  transactions: InstallmentItem[];
}

