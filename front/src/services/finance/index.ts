import { transactionsService } from './transactions';
import { accountsService } from './accounts';
import { categoriesService } from './categories';
import { budgetsService } from './budgets';
import { recurringService } from './recurring';
import { installmentsService } from './installments';

export const financeService = {
  transactions: transactionsService,
  accounts: accountsService,
  categories: categoriesService,
  budgets: budgetsService,
  recurring: recurringService,
  installments: installmentsService,
};

