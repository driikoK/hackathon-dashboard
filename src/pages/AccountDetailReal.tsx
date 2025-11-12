import { useParams, useNavigate } from 'react-router-dom';
import { useState, useMemo } from 'react';
import accountsData from '../db/accounts-real.json';
import transactionsData from '../db/transactions-real.json';
import './AccountDetail.css';

interface RealAccount {
  id: number;
  name: string;
  current_balance: string;
  type: string;
  accountNumber: string;
  iban: string | null;
  currency: {
    code: string;
    name: string;
  };
  bank: {
    name: string;
    logo: string;
  };
}

interface RealTransaction {
  id: number;
  accountId: number;
  merchant: {
    name: string;
    logo: string;
  } | null;
  amount: string;
  currency: {
    code: string;
  };
  type: string;
  status: string;
  category: {
    name: string;
    icon?: string;
  } | null;
  transactionDate: string;
  description: string;
  notes: string | null;
}

const AccountDetailReal = () => {
  const { accountId } = useParams<{ accountId: string }>();
  const navigate = useNavigate();
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const account: RealAccount | undefined = accountsData.data.find(
    (acc: RealAccount) => acc.id === parseInt(accountId || '0')
  );

  // Get ALL transactions for this account (not filtered)
  const allTransactions: RealTransaction[] = useMemo(() => {
    return (transactionsData.data || [])
      .filter((t: any) => t.accountId === parseInt(accountId || '0'))
      .sort((a: any, b: any) => 
        new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime()
      ) as unknown as RealTransaction[];
  }, [accountId]);

  // Apply filters
  const transactions = useMemo(() => {
    let filtered = allTransactions;

    // Filter by type
    if (filterType === 'income') {
      filtered = filtered.filter(t => t.type === 'INCOME');
    } else if (filterType === 'expense') {
      filtered = filtered.filter(t => t.type === 'EXPENSE');
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(t => {
        const merchant = (t.merchant?.name || '').toLowerCase();
        const category = (t.category?.name || '').toLowerCase();
        return merchant.includes(query) || category.includes(query);
      });
    }

    return filtered;
  }, [allTransactions, filterType, searchQuery]);

  // Calculate statistics
  const stats = useMemo(() => {
    const income = allTransactions
      .filter(t => t.type === 'INCOME')
      .reduce((sum, t) => sum + Math.abs(parseFloat(t.amount)), 0);
    
    const expenses = allTransactions
      .filter(t => t.type === 'EXPENSE')
      .reduce((sum, t) => sum + Math.abs(parseFloat(t.amount)), 0);

    return {
      total: allTransactions.length,
      income,
      expenses,
      net: income - expenses
    };
  }, [allTransactions]);

  if (!account) {
    return <div>Account not found</div>;
  }

  const balance = parseFloat(account.current_balance);

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

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      'Food & Dining': '#fef3c7',
      'Shopping': '#fce7f3',
      'Transportation': '#dbeafe',
      'Bills & Utilities': '#e0e7ff',
      'Entertainment': '#fef9c3',
      'Health & Fitness': '#dcfce7',
      'Travel': '#fbcfe8',
      'Income': '#d1fae5',
      'Transfer': '#dbeafe',
    };
    return colors[category] || '#f3f4f6';
  };

  const groupTransactionsByDate = () => {
    const grouped: { [key: string]: RealTransaction[] } = {};
    
    transactions.forEach(transaction => {
      const date = formatDate(transaction.transactionDate);
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(transaction);
    });

    return grouped;
  };

  const groupedTransactions = groupTransactionsByDate();

  const getAccountTypeInfo = (type: string) => {
    switch (type) {
      case 'CHECKING':
        return { icon: '💳', label: 'Checking', color: '#3b82f6' };
      case 'CREDIT':
        return { icon: '💎', label: 'Credit', color: '#10b981' };
      case 'SAVINGS':
        return { icon: '💰', label: 'Savings', color: '#f59e0b' };
      default:
        return { icon: '💼', label: type, color: '#6366f1' };
    }
  };

  const typeInfo = getAccountTypeInfo(account.type);

  return (
    <div className="account-detail-page-modern">
      {/* Hero Section */}
      <div className="account-hero-section">
        <div className="account-hero-content">
          <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
            <button className="back-button-modern" onClick={() => navigate('/real-dataset/accounts')}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="15 18 9 12 15 6"></polyline>
              </svg>
              <span>Back to Accounts</span>
            </button>
            <button className="back-button-modern" onClick={() => navigate('/', { state: { section: 4 } })}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
              </svg>
              <span>Back to Presentation</span>
            </button>
          </div>

          <div className="account-hero-header">
            <div className="bank-info-hero">
              <div className="bank-icon-large-hero">
                <img src={account.bank.logo} alt={account.bank.name} />
              </div>
              <div className="bank-text-info">
                <h1 className="account-page-title">{account.bank.name}</h1>
                <div className="account-meta-info">
                  <span className="account-type-badge" style={{ background: typeInfo.color }}>
                    {typeInfo.icon} {typeInfo.label}
                  </span>
                  <span className="account-number-badge">
                    •••• {account.accountNumber.slice(-4)}
                  </span>
                </div>
              </div>
            </div>

            <div className="balance-display-large">
              <div className="balance-label-hero">Current Balance</div>
              <div className="balance-amount-hero">
                {balance < 0 && '-'}
                {formatCurrency(balance, account.currency.code)}
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="stats-grid-account">
            <div className="stat-card-modern">
              <div className="stat-icon-modern">📊</div>
              <div className="stat-info">
                <div className="stat-value-modern">{stats.total}</div>
                <div className="stat-label-modern">Total Transactions</div>
              </div>
            </div>

            <div className="stat-card-modern stat-income">
              <div className="stat-icon-modern">💰</div>
              <div className="stat-info">
                <div className="stat-value-modern">+{formatCurrency(stats.income, account.currency.code)}</div>
                <div className="stat-label-modern">Total Income</div>
              </div>
            </div>

            <div className="stat-card-modern stat-expense">
              <div className="stat-icon-modern">💸</div>
              <div className="stat-info">
                <div className="stat-value-modern">-{formatCurrency(stats.expenses, account.currency.code)}</div>
                <div className="stat-label-modern">Total Expenses</div>
              </div>
            </div>

            <div className="stat-card-modern">
              <div className="stat-icon-modern">📈</div>
              <div className="stat-info">
                <div className="stat-value-modern" style={{ color: '#ffffff' }}>
                  {stats.net >= 0 ? '+' : '-'}{formatCurrency(Math.abs(stats.net), account.currency.code)}
                </div>
                <div className="stat-label-modern">Net Flow</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="account-content-section">
        <div className="account-content-wrapper">
          {/* Toolbar */}
          <div className="transactions-toolbar-modern">
            <div className="toolbar-left-section">
              <h2 className="section-title-modern">All Transactions</h2>
              <span className="count-badge-modern">{transactions.length}</span>
            </div>

            <div className="toolbar-right-section">
              {/* Search */}
              <div className="search-box-modern">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8"></circle>
                  <path d="m21 21-4.35-4.35"></path>
                </svg>
                <input
                  type="text"
                  placeholder="Search transactions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="search-input-modern"
                />
              </div>

              {/* Filters */}
              <div className="filter-group-modern">
                <button 
                  className={`filter-btn-modern ${filterType === 'all' ? 'active' : ''}`}
                  onClick={() => setFilterType('all')}
                >
                  All
                </button>
                <button 
                  className={`filter-btn-modern ${filterType === 'income' ? 'active' : ''}`}
                  onClick={() => setFilterType('income')}
                >
                  Income
                </button>
                <button 
                  className={`filter-btn-modern ${filterType === 'expense' ? 'active' : ''}`}
                  onClick={() => setFilterType('expense')}
                >
                  Expenses
                </button>
              </div>
            </div>
          </div>

          {/* Transactions List */}
          <div className="transactions-card-modern">
            {transactions.length === 0 ? (
              <div className="empty-state-modern">
                <div className="empty-icon-modern">🔍</div>
                <h3>No transactions found</h3>
                <p>Try adjusting your search or filters</p>
              </div>
            ) : (
              <div className="transactions-list-modern">
                {Object.entries(groupedTransactions).map(([date, dateTransactions]) => (
                  <div key={date} className="transaction-group-modern">
                    <div className="transaction-date-header">{date}</div>
                    <div className="transaction-items-modern">
                      {dateTransactions.map((transaction) => {
                        const isPending = transaction.status === 'PENDING';
                        const isIncome = transaction.type === 'INCOME';
                        
                        const merchantName = transaction.merchant?.name || transaction.description || 'Transaction';
                        const merchantLogo = transaction.merchant?.logo;
                        
                        return (
                          <div key={transaction.id} className={`transaction-item-modern ${isPending ? 'pending' : ''}`}>
                            <div className="transaction-left-section">
                              <div className={`transaction-icon-modern ${isIncome ? 'income' : 'expense'}`}>
                                {merchantLogo ? (
                                  <img src={merchantLogo} alt={merchantName} style={{ width: '32px', height: '32px', objectFit: 'contain' }} />
                                ) : (
                                  <span>{isIncome ? '💰' : '💳'}</span>
                                )}
                              </div>
                              <div className="transaction-details-modern">
                                <div className="transaction-merchant-modern">
                                  {merchantName}
                                  {isPending && <span className="pending-badge-modern">Pending</span>}
                                </div>
                                <div className="transaction-meta-modern">
                                  <span className="transaction-category-modern" style={{ backgroundColor: getCategoryColor(transaction.category?.name || 'Other') }}>
                                    {transaction.category?.name || 'Uncategorized'}
                                  </span>
                                  <span className="transaction-time-modern">
                                    {new Date(transaction.transactionDate).toLocaleTimeString('en-US', { 
                                      hour: '2-digit', 
                                      minute: '2-digit' 
                                    })}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className={`transaction-amount-modern ${isIncome ? 'income' : 'expense'}`}>
                              {isIncome ? '+' : '-'}
                              {formatCurrency(Math.abs(parseFloat(transaction.amount)), transaction.currency.code)}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountDetailReal;
