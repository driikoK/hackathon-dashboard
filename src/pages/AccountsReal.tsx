import { useNavigate } from 'react-router-dom';
import { useState, useMemo } from 'react';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import accountsData from '../db/accounts-real.json';
import transactionsData from '../db/transactions-real.json';
import UseCasesIntro from '../components/UseCasesIntro';
import './Accounts.css';

type ViewMode = 'all' | 'bank' | 'type';

interface RealAccount {
  id: number;
  name: string;
  current_balance: string;
  current_balance_usd: string;
  type: string;
  bankId: number;
  currencyId: number;
  iban: string | null;
  accountNumber: string;
  credit_limit: string | null;
  is_in_networth: boolean;
  show: boolean;
  archived: boolean;
  currency: {
    code: string;
    name: string;
  };
  bank: {
    name: string;
    logo: string;
  };
}

const AccountsReal = () => {
  const navigate = useNavigate();
  const accounts: RealAccount[] = accountsData.data.filter(acc => acc.show && !acc.archived);
  const [viewMode, setViewMode] = useState<ViewMode>('all');
  const [includedAccounts, setIncludedAccounts] = useState<Set<number>>(() => {
    return new Set(accounts.filter(acc => acc.is_in_networth).map(acc => acc.id));
  });

  const toggleAccountInclusion = (accountId: number, e: React.MouseEvent | React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    setIncludedAccounts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(accountId)) {
        newSet.delete(accountId);
      } else {
        newSet.add(accountId);
      }
      return newSet;
    });
  };

  const getAccountBalance = (account: RealAccount): number => {
    return parseFloat(account.current_balance);
  };

  const totalNetworth = accounts
    .filter(account => includedAccounts.has(account.id))
    .reduce((sum, account) => {
      return sum + getAccountBalance(account);
    }, 0);

  const formatCurrency = (amount: number, currency: string = '') => {
    const formatted = new Intl.NumberFormat('en-AE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Math.abs(amount));
    
    const currencySuffix = currency ? ' ' + currency : '';
    return formatted + currencySuffix;
  };

  const formatCurrencyWithSign = (amount: number, currency: string = '') => {
    const sign = amount < 0 ? '-' : '';
    const formatted = new Intl.NumberFormat('en-AE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Math.abs(amount));
    
    const currencySuffix = currency ? ' ' + currency : '';
    return sign + formatted + currencySuffix;
  };

  // Group accounts by bank
  const accountsByBank = useMemo(() => {
    const grouped = new Map<string, RealAccount[]>();
    accounts.forEach(account => {
      const bankName = account.bank.name;
      if (!grouped.has(bankName)) {
        grouped.set(bankName, []);
      }
      grouped.get(bankName)!.push(account);
    });
    return grouped;
  }, [accounts]);

  // Group accounts by type
  const accountsByType = useMemo(() => {
    const grouped = new Map<string, RealAccount[]>();
    accounts.forEach(account => {
      const type = account.type;
      if (!grouped.has(type)) {
        grouped.set(type, []);
      }
      grouped.get(type)!.push(account);
    });
    return grouped;
  }, [accounts]);

  // Calculate statistics
  const stats = useMemo(() => {
    let totalAssets = 0;
    let totalLiabilities = 0;
    let checkingTotal = 0;
    let creditTotal = 0;

    accounts.forEach(account => {
      if (includedAccounts.has(account.id)) {
        const balance = getAccountBalance(account);
        if (balance >= 0) {
          totalAssets += balance;
        } else {
          totalLiabilities += Math.abs(balance);
        }
        
        if (account.type === 'CHECKING') {
          checkingTotal += balance;
        } else if (account.type === 'CREDIT') {
          creditTotal += balance;
        }
      }
    });

    const uniqueBanks = new Set(accounts.map(a => a.bank.name));

    return {
      totalAssets,
      totalLiabilities,
      checkingTotal,
      creditTotal,
      accountCount: includedAccounts.size,
      bankCount: uniqueBanks.size
    };
  }, [accounts, includedAccounts]);

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

  // Calculate real net worth history based on actual transactions
  const generateDailyNetWorthHistory = () => {
    const history = [];
    const startDate = new Date('2025-05-13');
    const endDate = new Date('2025-11-13');
    const totalDays = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    
    // Get current balances for each account
    const currentBalances = new Map<number, number>();
    accounts.forEach(acc => {
      currentBalances.set(acc.id, parseFloat(acc.current_balance));
    });
    
    // Get all transactions sorted by date (newest first)
    const allTransactions = (transactionsData.data || [])
      .filter((t: { accountId: number }) => includedAccounts.has(t.accountId))
      .sort((a: { transactionDate: string }, b: { transactionDate: string }) => 
        new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime()
      );
    
    // Calculate balance for each day going backwards from today
    for (let i = totalDays; i >= 0; i--) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      currentDate.setHours(23, 59, 59, 999); // End of day
      
      const month = currentDate.toLocaleDateString('en-US', { month: 'short' });
      const day = currentDate.getDate();
      
      // Calculate what the balance was on this date by working backwards from current balance
      const balancesOnDate = new Map(currentBalances);
      
      // Subtract all transactions that happened AFTER this date
      allTransactions.forEach((t: { transactionDate: string; accountId: number; type: string; amount: string }) => {
        const transactionDate = new Date(t.transactionDate);
        if (transactionDate > currentDate) {
          const accountId = t.accountId;
          const amount = parseFloat(t.amount);
          const currentBalance = balancesOnDate.get(accountId) || 0;
          
          // Reverse the transaction: subtract income, add back expenses
          if (t.type === 'INCOME') {
            balancesOnDate.set(accountId, currentBalance - amount);
          } else {
            balancesOnDate.set(accountId, currentBalance + Math.abs(amount));
          }
        }
      });
      
      // Calculate total assets and debt for this date
      let assetsOnDate = 0;
      let debtOnDate = 0;
      
      balancesOnDate.forEach((balance, accountId) => {
        if (includedAccounts.has(accountId)) {
          if (balance >= 0) {
            assetsOnDate += balance;
          } else {
            debtOnDate += Math.abs(balance);
          }
        }
      });
      
      const networthOnDate = assetsOnDate - debtOnDate;
      
      history.unshift({
        date: `${month} ${day}`,
        netWorth: networthOnDate,
        assets: assetsOnDate,
        debt: debtOnDate
      });
    }
    
    return history;
  };

  const netWorthHistory = generateDailyNetWorthHistory();

  return (
    <div className="accounts-page-modern">
      {/* Hero Section with Net Worth */}
      <div className="hero-section">
        <div className="hero-content">
          <button 
            className="back-button-modern" 
            onClick={() => navigate('/', { state: { section: 4 } })}
            style={{ marginBottom: '20px' }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
            </svg>
            <span>Back to Presentation</span>
          </button>

          {/* Use Cases Introduction */}
          <UseCasesIntro />

          <div className="hero-header">
            <div>
              <h1 className="page-title">Financial Overview</h1>
              <p className="page-subtitle">Track your wealth across all accounts</p>
            </div>
          </div>

          <div className="networth-card">
            <div className="networth-main">
              <span className="networth-label">Total Net Worth</span>
              <div className="networth-amount-display">
                <span className="currency-symbol">AED</span>
                <span className={`networth-value ${totalNetworth < 0 ? 'negative' : ''}`}>
                  {formatCurrencyWithSign(totalNetworth)}
                </span>
              </div>
            </div>
            
            <div className="networth-breakdown">
              <div className="breakdown-item assets">
                <div className="breakdown-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                  </svg>
                </div>
                <div className="breakdown-info">
                  <span className="breakdown-label">Assets</span>
                  <span className="breakdown-value">{formatCurrency(stats.totalAssets, 'AED')}</span>
                </div>
              </div>
              
              <div className="breakdown-item liabilities">
                <div className="breakdown-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </div>
                <div className="breakdown-info">
                  <span className="breakdown-label">Liabilities</span>
                  <span className="breakdown-value">{formatCurrency(stats.totalLiabilities, 'AED')}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Net Worth Chart */}
          <div className="networth-chart-card">
            <div className="chart-header">
              <div>
                <h3 className="chart-title">Net Worth Trend</h3>
                <p className="chart-subtitle">Your financial journey over time</p>
              </div>
              <div className="chart-legend">
                <div className="legend-item">
                  <div className="legend-color assets"></div>
                  <span>Assets</span>
                </div>
                <div className="legend-item">
                  <div className="legend-color debt"></div>
                  <span>Liabilities</span>
                </div>
                <div className="legend-item">
                  <div className="legend-color networth"></div>
                  <span>Net Worth</span>
                </div>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart
                data={netWorthHistory}
                margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorNetWorth" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#667eea" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#667eea" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorAssets" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorDebt" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  stroke="#9ca3af"
                  style={{ fontSize: '12px' }}
                  tickLine={false}
                />
                <YAxis 
                  stroke="#9ca3af"
                  style={{ fontSize: '12px' }}
                  tickLine={false}
                  tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '12px',
                    padding: '12px',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                  }}
                  formatter={(value: number) => `AED ${value.toLocaleString()}`}
                />
                <Area 
                  type="linear" 
                  dataKey="assets" 
                  stroke="#10b981" 
                  strokeWidth={0}
                  fill="transparent"
                  strokeOpacity={0}
                  fillOpacity={0}
                />
                <Area 
                  type="linear" 
                  dataKey="debt" 
                  stroke="#ef4444" 
                  strokeWidth={0}
                  fill="transparent"
                  strokeOpacity={0}
                  fillOpacity={0}
                />
                <Area 
                  type="linear" 
                  dataKey="netWorth" 
                  stroke="#667eea" 
                  strokeWidth={3}
                  fill="url(#colorNetWorth)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Quick Stats */}
          <div className="quick-stats">
            <div className="stat-card">
              <div className="stat-icon bank">🏦</div>
              <div className="stat-content">
                <span className="stat-value">{stats.bankCount}</span>
                <span className="stat-label">Banks</span>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon accounts">💼</div>
              <div className="stat-content">
                <span className="stat-value">{stats.accountCount}</span>
                <span className="stat-label">Active Accounts</span>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon savings">💳</div>
              <div className="stat-content">
                <span className={`stat-value ${stats.checkingTotal < 0 ? 'negative' : ''}`}>
                  {formatCurrencyWithSign(stats.checkingTotal)}
                </span>
                <span className="stat-label">Checking</span>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon current">💎</div>
              <div className="stat-content">
                <span className={`stat-value ${stats.creditTotal < 0 ? 'negative' : ''}`}>
                  {formatCurrencyWithSign(stats.creditTotal)}
                </span>
                <span className="stat-label">Credit</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* View Mode Switcher */}
      <div className="view-controls">
        <div className="view-mode-tabs">
          <button 
            className={`view-tab ${viewMode === 'all' ? 'active' : ''}`}
            onClick={() => setViewMode('all')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7"></rect>
              <rect x="14" y="3" width="7" height="7"></rect>
              <rect x="14" y="14" width="7" height="7"></rect>
              <rect x="3" y="14" width="7" height="7"></rect>
            </svg>
            All Accounts
          </button>
          <button 
            className={`view-tab ${viewMode === 'bank' ? 'active' : ''}`}
            onClick={() => setViewMode('bank')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
            </svg>
            By Bank
          </button>
          <button 
            className={`view-tab ${viewMode === 'type' ? 'active' : ''}`}
            onClick={() => setViewMode('type')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="8" y1="6" x2="21" y2="6"></line>
              <line x1="8" y1="12" x2="21" y2="12"></line>
              <line x1="8" y1="18" x2="21" y2="18"></line>
              <line x1="3" y1="6" x2="3.01" y2="6"></line>
              <line x1="3" y1="12" x2="3.01" y2="12"></line>
              <line x1="3" y1="18" x2="3.01" y2="18"></line>
            </svg>
            By Type
          </button>
        </div>
      </div>

      {/* Accounts Display */}
      <div className="accounts-container">
        {viewMode === 'all' && (
          <div className="accounts-grid">
            {accounts.map((account) => {
              const balance = getAccountBalance(account);
              const isIncluded = includedAccounts.has(account.id);
              const typeInfo = getAccountTypeInfo(account.type);
              
              return (
                <div
                  key={account.id}
                  className={`account-card-modern ${!isIncluded ? 'excluded' : ''}`}
                  onClick={() => navigate(`/real-dataset/account/${account.id}`)}
                >
                  <div className="account-card-header">
                    <div className="bank-badge">
                      <img src={account.bank.logo} alt={account.bank.name} className="bank-logo-img" />
                    </div>
                    <div className="account-toggle" onClick={(e) => e.stopPropagation()}>
                      <label className="modern-toggle">
                        <input
                          type="checkbox"
                          checked={isIncluded}
                          onChange={(e) => toggleAccountInclusion(account.id, e)}
                        />
                        <span className="toggle-track"></span>
                      </label>
                    </div>
                  </div>
                  
                  <div className="account-card-body">
                    <div className="account-type">
                      <span className="type-icon">{typeInfo.icon}</span>
                      <span className="type-label">{typeInfo.label}</span>
                    </div>
                    <h3 className="account-title">{account.name}</h3>
                    <div className="account-number">•••• {account.accountNumber.slice(-4)}</div>
                  </div>
                  
                  <div className="account-card-footer">
                    <div className="balance-info">
                      <span className="balance-label">Balance</span>
                      <div className={`balance-amount ${balance < 0 ? 'negative' : 'positive'}`}>
                        {balance < 0 && '-'}
                        <span className="amount-value">{formatCurrency(balance, account.currency.code)}</span>
                      </div>
                    </div>
                    <button className="view-details-btn">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="9 18 15 12 9 6"></polyline>
                      </svg>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {viewMode === 'bank' && (
          <div className="grouped-view">
            {Array.from(accountsByBank.entries()).map(([bankName, bankAccounts]) => {
              const bankTotal = bankAccounts
                .filter(acc => includedAccounts.has(acc.id))
                .reduce((sum, acc) => sum + getAccountBalance(acc), 0);
              
              return (
                <div key={bankName} className="bank-group">
                  <div className="bank-group-header">
                    <div className="bank-info-display">
                      <div className="bank-icon-large">
                        <img src={bankAccounts[0].bank.logo} alt={bankName} className="bank-logo-img" />
                      </div>
                      <div>
                        <h3 className="bank-name">{bankName}</h3>
                        <p className="bank-accounts-count">{bankAccounts.length} account{bankAccounts.length > 1 ? 's' : ''}</p>
                      </div>
                    </div>
                    <div className="bank-total">
                      <span className="total-label">Total</span>
                      <span className={`total-value ${bankTotal < 0 ? 'negative' : ''}`}>
                        {formatCurrency(bankTotal, 'AED')}
                      </span>
                    </div>
                  </div>
                  
                  <div className="bank-accounts-list">
                    {bankAccounts.map((account) => {
                      const balance = getAccountBalance(account);
                      const isIncluded = includedAccounts.has(account.id);
                      const typeInfo = getAccountTypeInfo(account.type);
                      
                      return (
                        <div
                          key={account.id}
                          className={`account-row ${!isIncluded ? 'excluded' : ''}`}
                          onClick={() => navigate(`/real-dataset/account/${account.id}`)}
                        >
                          <div className="account-row-left">
                            <span className="account-type-icon">{typeInfo.icon}</span>
                            <div className="account-row-info">
                              <span className="account-row-name">{account.name}</span>
                              <span className="account-row-number">•••• {account.accountNumber.slice(-4)}</span>
                            </div>
                          </div>
                          
                          <div className="account-row-right">
                            <span className={`account-row-balance ${balance < 0 ? 'negative' : ''}`}>
                              {balance < 0 && '-'}{formatCurrency(balance, account.currency.code)}
                            </span>
                            <div className="account-row-toggle" onClick={(e) => e.stopPropagation()}>
                              <label className="modern-toggle">
                                <input
                                  type="checkbox"
                                  checked={isIncluded}
                                  onChange={(e) => toggleAccountInclusion(account.id, e)}
                                />
                                <span className="toggle-track"></span>
                              </label>
                            </div>
                            <svg className="chevron-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <polyline points="9 18 15 12 9 6"></polyline>
                            </svg>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {viewMode === 'type' && (
          <div className="grouped-view">
            {Array.from(accountsByType.entries()).map(([type, typeAccounts]) => {
              const typeInfo = getAccountTypeInfo(type);
              const typeTotal = typeAccounts
                .filter(acc => includedAccounts.has(acc.id))
                .reduce((sum, acc) => sum + getAccountBalance(acc), 0);
              
              return (
                <div key={type} className="type-group">
                  <div className="type-group-header">
                    <div className="type-info-display">
                      <div className="type-icon-large" style={{ background: typeInfo.color }}>
                        {typeInfo.icon}
                      </div>
                      <div>
                        <h3 className="type-name">{typeInfo.label}</h3>
                        <p className="type-accounts-count">{typeAccounts.length} account{typeAccounts.length > 1 ? 's' : ''}</p>
                      </div>
                    </div>
                    <div className="type-total">
                      <span className="total-label">Total</span>
                      <span className={`total-value ${typeTotal < 0 ? 'negative' : ''}`}>
                        {formatCurrency(typeTotal, 'AED')}
                      </span>
                    </div>
                  </div>
                  
                  <div className="type-accounts-list">
                    {typeAccounts.map((account) => {
                      const balance = getAccountBalance(account);
                      const isIncluded = includedAccounts.has(account.id);
                      
                      return (
                        <div
                          key={account.id}
                          className={`account-row ${!isIncluded ? 'excluded' : ''}`}
                          onClick={() => navigate(`/real-dataset/account/${account.id}`)}
                        >
                          <div className="account-row-left">
                            <div className="bank-mini-icon">
                              <img src={account.bank.logo} alt={account.bank.name} className="bank-logo-img" />
                            </div>
                            <div className="account-row-info">
                              <span className="account-row-name">{account.name}</span>
                              <span className="account-row-number">•••• {account.accountNumber.slice(-4)}</span>
                            </div>
                          </div>
                          
                          <div className="account-row-right">
                            <span className={`account-row-balance ${balance < 0 ? 'negative' : ''}`}>
                              {balance < 0 && '-'}{formatCurrency(balance, account.currency.code)}
                            </span>
                            <div className="account-row-toggle" onClick={(e) => e.stopPropagation()}>
                              <label className="modern-toggle">
                                <input
                                  type="checkbox"
                                  checked={isIncluded}
                                  onChange={(e) => toggleAccountInclusion(account.id, e)}
                                />
                                <span className="toggle-track"></span>
                              </label>
                            </div>
                            <svg className="chevron-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <polyline points="9 18 15 12 9 6"></polyline>
                            </svg>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default AccountsReal;
