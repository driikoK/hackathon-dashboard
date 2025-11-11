import type { Account } from '../types';
import balancesData from '../db/balances.json';
import transactionsData from '../db/transactions.json';

export interface AccountHistory {
  date: Date;
  balance: number;
}

export interface NetWorthHistory {
  date: Date;
  netWorth: number;
  assets: number;
  debt: number;
}

const getDates = (startDate: Date, endDate: Date): Date[] => {
  const dates: Date[] = [];
  const currentDate = new Date(startDate);
  
  while (currentDate <= endDate) {
    dates.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return dates;
};

const groupTransactionsByDate = (transactions: any[]) => {
  const grouped: { [key: string]: any[] } = {};
  
  transactions.forEach(transaction => {
    const dateKey = transaction.TransactionDateTime.split('T')[0];
    if (!grouped[dateKey]) {
      grouped[dateKey] = [];
    }
    grouped[dateKey].push(transaction);
  });
  
  return Object.keys(grouped).map(date => ({
    date,
    transactions: grouped[date]
  })).sort((a, b) => a.date.localeCompare(b.date));
};

const calculateTransactionSum = (transactions: any[]): number => {
  return transactions.reduce((sum, transaction) => {
    const amount = parseFloat(transaction.Amount.Amount);
    return sum + (transaction.CreditDebitIndicator === 'Credit' ? amount : -amount);
  }, 0);
};

export const getAccountHistory = (accountId: string): AccountHistory[] => {
  // Priority order for balance types (most reliable first)
  const balanceTypePriority = [
    'ClosingAvailable',
    'ClosingBooked',
    'ClosingCleared',
    'InterimAvailable',
    'ForwardAvailable',
    'OpeningAvailable',
    'OpeningBooked',
    'OpeningCleared',
    'Expected',
    'PreviouslyClosedBooked',
    'Information'
  ];

  // Get all balances for the account
  const accountBalances = balancesData.Balance.filter(
    (b: any) => b.AccountId === accountId
  );
  
  if (accountBalances.length === 0) return [];
  
  // Find the most recent balance of the highest priority type available
  let latestBalance = null;
  
  for (const type of balanceTypePriority) {
    const balancesOfType = accountBalances.filter((b: any) => b.Type === type);
    if (balancesOfType.length > 0) {
      const sorted = balancesOfType.sort(
        (a: any, b: any) => new Date(b.DateTime).getTime() - new Date(a.DateTime).getTime()
      );
      latestBalance = sorted[0];
      break;
    }
  }

  // Fallback: if no priority type found, just get the most recent balance
  if (!latestBalance) {
    const sortedBalances = accountBalances.sort(
      (a: any, b: any) => new Date(b.DateTime).getTime() - new Date(a.DateTime).getTime()
    );
    latestBalance = sortedBalances[0];
  }
  
  if (!latestBalance) return [];
  
  let currentBalance = parseFloat(latestBalance.Amount.Amount);
  if (latestBalance.CreditDebitIndicator === 'Debit') {
    currentBalance = -currentBalance;
  }
  
  // Get transactions for this account (skip pending transactions for net worth calculation)
  const accountTransactions = transactionsData.Transaction.filter(
    (t: any) => {
      if (t.AccountId !== accountId) return false;
      if (t.SubTransactionType !== 'Purchase' && t.SubTransactionType !== 'Deposit') return false;
      // Only include Booked transactions, skip Pending
      if (t.Status !== 'Booked') return false;
      return true;
    }
  );
  
  if (accountTransactions.length === 0) {
    return [{
      date: new Date(),
      balance: currentBalance
    }];
  }
  
  const groupedTransactions = groupTransactionsByDate(accountTransactions);
  
  const endDate = new Date();
  const startDate = new Date(groupedTransactions[0].date);
  
  const dates = getDates(startDate, endDate).reverse();
  
  const history: AccountHistory[] = [];
  let balance = currentBalance;
  
  for (const date of dates) {
    const dateKey = date.toISOString().split('T')[0];
    
    const transactionsForDate = groupedTransactions.find(
      group => group.date === dateKey
    );
    
    history.push({
      date: new Date(date),
      balance: Math.round(balance * 100) / 100
    });
    
    if (transactionsForDate) {
      balance -= calculateTransactionSum(transactionsForDate.transactions);
    }
  }
  
  return history.reverse();
};

export const getNetWorthHistory = (accounts: Account[]): NetWorthHistory[] => {
  const allHistories = accounts.map(account => ({
    accountId: account.AccountId,
    history: getAccountHistory(account.AccountId)
  }));
  
  if (allHistories.length === 0) return [];
  
  // Get the common date range
  const allDates = allHistories
    .flatMap(h => h.history.map(entry => entry.date.toISOString().split('T')[0]))
    .filter((value, index, self) => self.indexOf(value) === index)
    .sort();
  
  const netWorthHistory: NetWorthHistory[] = [];
  
  for (const dateStr of allDates) {
    let assets = 0;
    let debt = 0;
    
    for (const accountHistory of allHistories) {
      const entry = accountHistory.history.find(
        h => h.date.toISOString().split('T')[0] === dateStr
      );
      
      if (entry) {
        if (entry.balance > 0) {
          assets += entry.balance;
        } else {
          debt += Math.abs(entry.balance);
        }
      }
    }
    
    netWorthHistory.push({
      date: new Date(dateStr),
      netWorth: Math.round((assets - debt) * 100) / 100,
      assets: Math.round(assets * 100) / 100,
      debt: Math.round(debt * 100) / 100
    });
  }
  
  // Return last 6 months
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  
  return netWorthHistory.filter(entry => entry.date >= sixMonthsAgo);
};
