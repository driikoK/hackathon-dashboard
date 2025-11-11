import { useParams, useNavigate } from 'react-router-dom';
import accountsData from '../db/accounts.json';
import transactionsData from '../db/transactions.json';
import balancesData from '../db/balances.json';
import banksData from '../db/banks.json';
import type { Account, Transaction } from '../types';
import './AccountDetail.css';

const AccountDetail = () => {
  const { accountId } = useParams<{ accountId: string }>();
  const navigate = useNavigate();

  const account: Account | undefined = accountsData.Data.Account.find(
    (acc: Account) => acc.AccountId === accountId
  );

  const transactions: Transaction[] = transactionsData.Transaction.filter(
    (t: any) => {
      // Filter by AccountId
      if (t.AccountId !== accountId) return false;
      
      // Filter by SubTransactionType: only Purchase or Deposit
      if (t.SubTransactionType !== 'Purchase' && t.SubTransactionType !== 'Deposit') return false;
      
      // Filter by Status: only Pending or Booked
      if (t.Status !== 'Pending' && t.Status !== 'Booked') return false;
      
      return true;
    }
  ).sort((a: any, b: any) => new Date(b.TransactionDateTime).getTime() - new Date(a.TransactionDateTime).getTime()) as Transaction[];

  if (!account) {
    return <div>Account not found</div>;
  }

  const bank = banksData.banks.find((b: any) => b.bankId === account.bankId);

  const getAccountBalance = (): number => {
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

    if (accountBalances.length === 0) return 0;

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

    if (!latestBalance) return 0;

    const amount = parseFloat(latestBalance.Amount.Amount);
    return latestBalance.CreditDebitIndicator === 'Debit' ? -amount : amount;
  };

  const balance = getAccountBalance();

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-AE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Math.abs(amount)) + ' ' + currency;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = date.getDate();
    const month = date.toLocaleDateString('en-US', { month: 'short' });
    const year = date.getFullYear();
    
    const weekday = date.toLocaleDateString('en-US', { weekday: 'short' });
    
    return `${weekday}, ${month}. ${day}${getDaySuffix(day)} ${year}`;
  };

  const getDaySuffix = (day: number) => {
    if (day > 3 && day < 21) return 'th';
    switch (day % 10) {
      case 1: return 'st';
      case 2: return 'nd';
      case 3: return 'rd';
      default: return 'th';
    }
  };

  const getTransactionIcon = (type: string, subType: string) => {
    if (type === 'POS' || subType === 'Purchase') return '🏪';
    if (type === 'InternationalTransfer' || subType === 'MoneyTransfer') return '🌍';
    if (subType === 'Deposit') return '💰';
    if (type === 'ATM') return '🏧';
    if (subType === 'Withdrawal') return '💸';
    return '💳';
  };

  const getCategoryColor = (type: string) => {
    const colors: { [key: string]: string } = {
      'Rental / Lease Income': '#fef3c7',
      'Transfer': '#dbeafe',
      'Other Income': '#fef3c7',
      'Bills / Utilities': '#dbeafe',
      'Other / Miscellaneous': '#fef9c3',
    };
    return colors[type] || '#f3f4f6';
  };

  const getTransactionCategory = (transaction: Transaction): string => {
    const merchantName = transaction.MerchantDetails?.MerchantName || '';
    const transactionType = transaction.TransactionType;
    const subType = transaction.SubTransactionType;

    if (merchantName.includes('Amana')) return 'Rental / Lease Income';
    if (merchantName.includes('DTB')) return 'Other Income';
    if (transactionType === 'InternationalTransfer') return 'Transfer';
    if (merchantName.includes('Home Loan')) return 'Other / Miscellaneous';
    if (merchantName.includes('ML-AC')) return 'Bills / Utilities';
    
    return subType || transactionType;
  };

  const groupTransactionsByDate = () => {
    const grouped: { [key: string]: Transaction[] } = {};
    
    transactions.forEach(transaction => {
      const date = formatDate(transaction.TransactionDateTime);
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(transaction);
    });

    return grouped;
  };

  const groupedTransactions = groupTransactionsByDate();

  return (
    <div className="account-detail-page">
      <button className="back-button" onClick={() => navigate('/')}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="15 18 9 12 15 6"></polyline>
        </svg>
      </button>

      <div className="account-header">
        <div className="bank-info">
          <div className="bank-icon" style={{ backgroundColor: bank?.color || '#f3f4f6' }}>
            {bank?.logo || '🏦'}
          </div>
          <h1>{bank?.name || 'Bank'}</h1>
        </div>
        
        <div className="account-details">
          <div className="account-type">{account.AccountSubType.toUpperCase()}</div>
          <div className="account-number">
            *{account.AccountIdentifiers.find(id => id.SchemeName === 'AccountNumber')?.Identification.slice(-4)}
          </div>
        </div>

        <div className="account-description">
          {account.Description}
        </div>

        <div className="account-info-grid">
          <div className="info-item">
            <div className="info-label">Account Holder</div>
            <div className="info-value">{account.AccountHolderName}</div>
          </div>
          <div className="info-item">
            <div className="info-label">Account Type</div>
            <div className="info-value">{account.AccountType}</div>
          </div>
          <div className="info-item">
            <div className="info-label">IBAN</div>
            <div className="info-value">{account.AccountIdentifiers.find(id => id.SchemeName === 'IBAN')?.Identification}</div>
          </div>
          <div className="info-item">
            <div className="info-label">Status</div>
            <div className="info-value">
              <span className="status-badge">{account.Status}</span>
            </div>
          </div>
        </div>

        <div className="account-balance-header">
          {balance < 0 && '-'}
          {formatCurrency(balance, account.Currency)}
        </div>
      </div>

      <div className="transactions-section">
        <div className="transactions-header">
          <h3>{transactions.length} Transactions</h3>
        </div>

        <div className="transactions-list">
          {Object.entries(groupedTransactions).map(([date, dateTransactions]) => (
            <div key={date} className="transaction-group">
              <div className="transaction-date">{date}</div>
              {dateTransactions.map((transaction) => {
                const category = getTransactionCategory(transaction);
                const merchantName = transaction.MerchantDetails?.MerchantName || 
                                   transaction.ProprietaryBankTransactionCode?.Code || 
                                   transaction.TransactionType;
                const isPending = transaction.Status === 'Pending';
                
                return (
                  <div key={transaction.TransactionId} className={`transaction-item ${isPending ? 'pending' : ''}`}>
                    <div className="transaction-icon">
                      {getTransactionIcon(transaction.TransactionType, transaction.SubTransactionType)}
                    </div>
                    <div className="transaction-info">
                      <div className="transaction-merchant">
                        {merchantName}
                        {isPending && <span className="pending-badge">Pending</span>}
                      </div>
                      <div 
                        className="transaction-category" 
                        style={{ backgroundColor: getCategoryColor(category) }}
                      >
                        {category}
                      </div>
                    </div>
                    <div className={`transaction-amount ${transaction.CreditDebitIndicator.toLowerCase()}`}>
                      {transaction.CreditDebitIndicator === 'Debit' ? '-' : '+'}
                      {formatCurrency(parseFloat(transaction.Amount.Amount), transaction.Amount.Currency)}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AccountDetail;
