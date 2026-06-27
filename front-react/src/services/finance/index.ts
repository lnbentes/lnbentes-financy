import { transactionsService } from './transactions';
import { accountsService } from './accounts';
import { categoriesService } from './categories';

export const financeService = {
  transactions: transactionsService,
  accounts: accountsService,
  categories: categoriesService,
};
