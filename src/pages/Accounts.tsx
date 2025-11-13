import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useMemo } from 'react';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import accountsData from '../db/accounts.json';
import balancesData from '../db/balances.json';
import banksData from '../db/banks.json';
import type { Account } from '../types';
import { getNetWorthHistory, type NetWorthHistory } from '../utils/calculateHistory';
import NetWorthModal from '../components/NetWorthModal';
import PageLoader from '../components/PageLoader';
import './Accounts.css';

type ViewMode = 'all' | 'bank' | 'type';

interface Balance {
  AccountId: string;
  Type: string;
  DateTime: string;
  Amount: {
    Amount: string;
    Currency: string;
  };
  CreditDebitIndicator: string;
}

interface Bank {
  bankId: number;
  name: string;
  logo: string;
  color?: string;
}

const Accounts = () => {
  const navigate = useNavigate();
  const accounts: Account[] = accountsData.Data.Account;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [netWorthHistory, setNetWorthHistory] = useState<NetWorthHistory[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [includedAccounts, setIncludedAccounts] = useState<Set<string>>(() => {
    // Initialize with all accounts included
    return new Set(accounts.map(acc => acc.AccountId));
  });

  useEffect(() => {
    // Start calculations after a brief delay to show loader first
    const timer = setTimeout(() => {
      const includedAccountsList = accounts.filter(acc => includedAccounts.has(acc.AccountId));
      const history = getNetWorthHistory(includedAccountsList);
      setNetWorthHistory(history);
      setIsLoading(false);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!isLoading) {
      const includedAccountsList = accounts.filter(acc => includedAccounts.has(acc.AccountId));
      const history = getNetWorthHistory(includedAccountsList);
      setNetWorthHistory(history);
    }
  }, [includedAccounts, accounts, isLoading]);

  const toggleAccountInclusion = (accountId: string, e: React.MouseEvent | React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation(); // Prevent navigation when clicking toggle
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

  // Calculate balance for each account
  const getAccountBalance = (accountId: string): number => {
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
      (b: Balance) => b.AccountId === accountId
    );

    if (accountBalances.length === 0) return 0;

    // Find the most recent balance of the highest priority type available
    let latestBalance: Balance | null = null;
    
    for (const type of balanceTypePriority) {
      const balancesOfType = accountBalances.filter((b: Balance) => b.Type === type);
      if (balancesOfType.length > 0) {
        // Get the most recent balance of this type
        const sorted = balancesOfType.sort(
          (a: Balance, b: Balance) => new Date(b.DateTime).getTime() - new Date(a.DateTime).getTime()
        );
        latestBalance = sorted[0];
        break;
      }
    }

    // Fallback: if no priority type found, just get the most recent balance
    if (!latestBalance) {
      const sortedBalances = accountBalances.sort(
        (a: Balance, b: Balance) => new Date(b.DateTime).getTime() - new Date(a.DateTime).getTime()
      );
      latestBalance = sortedBalances[0];
    }

    if (!latestBalance) return 0;

    const amount = parseFloat(latestBalance.Amount.Amount);
    return latestBalance.CreditDebitIndicator === 'Debit' ? -amount : amount;
  };

  // Calculate total networth (only for included accounts)
  const totalNetworth = accounts
    .filter(account => includedAccounts.has(account.AccountId))
    .reduce((sum, account) => {
      return sum + getAccountBalance(account.AccountId);
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

  const getBankInfo = (bankId: number): Bank | undefined => {
    return banksData.banks.find((b: Bank) => b.bankId === bankId);
  };

  // Group accounts by bank
  const accountsByBank = useMemo(() => {
    const grouped = new Map<number, Account[]>();
    accounts.forEach(account => {
      const bankId = account.bankId;
      if (!grouped.has(bankId)) {
        grouped.set(bankId, []);
      }
      grouped.get(bankId)!.push(account);
    });
    return grouped;
  }, [accounts]);

  // Group accounts by type
  const accountsByType = useMemo(() => {
    const grouped = new Map<string, Account[]>();
    accounts.forEach(account => {
      const type = account.AccountSubType;
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
    let savingsTotal = 0;
    let currentTotal = 0;

    accounts.forEach(account => {
      if (includedAccounts.has(account.AccountId)) {
        const balance = getAccountBalance(account.AccountId);
        if (balance >= 0) {
          totalAssets += balance;
        } else {
          totalLiabilities += Math.abs(balance);
        }
        
        if (account.AccountSubType === 'Savings') {
          savingsTotal += balance;
        } else if (account.AccountSubType === 'CurrentAccount') {
          currentTotal += balance;
        }
      }
    });

    return {
      totalAssets,
      totalLiabilities,
      savingsTotal,
      currentTotal,
      accountCount: includedAccounts.size,
      bankCount: new Set(accounts.map(a => a.bankId)).size
    };
  }, [accounts, includedAccounts]);

  const getAccountTypeInfo = (type: string) => {
    switch (type) {
      case 'Savings':
        return { icon: '💎', label: 'Savings', color: '#10b981' };
      case 'CurrentAccount':
        return { icon: '💳', label: 'Current', color: '#3b82f6' };
      default:
        return { icon: '💼', label: type, color: '#6366f1' };
    }
  };

  if (isLoading) {
    return <PageLoader />;
  }

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
                data={netWorthHistory.map(item => ({
                  date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                  netWorth: item.netWorth,
                  assets: item.assets,
                  debt: item.debt
                }))}
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
                  domain={[0, 250000]}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '12px',
                    padding: '12px',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                  }}
                  formatter={(value: number, name: string) => {
                    if (name === 'netWorth') return [`AED ${value.toLocaleString()}`, 'Net Worth'];
                    return null;
                  }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div style={{
                          backgroundColor: 'white',
                          border: '1px solid #e5e7eb',
                          borderRadius: '12px',
                          padding: '12px',
                          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                        }}>
                          <p style={{ margin: '0 0 8px 0', fontWeight: 600, color: '#111827' }}>{data.date}</p>
                          <p style={{ margin: '4px 0', color: '#10b981', fontSize: '14px' }}>
                            Assets: <strong>AED {data.assets.toLocaleString()}</strong>
                          </p>
                          <p style={{ margin: '4px 0', color: '#ef4444', fontSize: '14px' }}>
                            Liabilities: <strong>AED {data.debt.toLocaleString()}</strong>
                          </p>
                          <p style={{ margin: '8px 0 0 0', color: '#667eea', fontSize: '14px', fontWeight: 600 }}>
                            Net Worth: <strong>AED {data.netWorth.toLocaleString()}</strong>
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area 
                  type="monotone" 
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
              <div className="stat-icon savings">💎</div>
              <div className="stat-content">
                <span className={`stat-value ${stats.savingsTotal < 0 ? 'negative' : ''}`}>
                  {formatCurrencyWithSign(stats.savingsTotal)}
                </span>
                <span className="stat-label">Savings</span>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon current">💳</div>
              <div className="stat-content">
                <span className={`stat-value ${stats.currentTotal < 0 ? 'negative' : ''}`}>
                  {formatCurrencyWithSign(stats.currentTotal)}
                </span>
                <span className="stat-label">Current</span>
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
              const balance = getAccountBalance(account.AccountId);
              const bank = getBankInfo(account.bankId);
              const isIncluded = includedAccounts.has(account.AccountId);
              const typeInfo = getAccountTypeInfo(account.AccountSubType);
              
              return (
                <div
                  key={account.AccountId}
                  className={`account-card-modern ${!isIncluded ? 'excluded' : ''}`}
                  onClick={() => navigate(`/model-dataset/account/${account.AccountId}`)}
                >
                  <div className="account-card-header">
                    <div className="bank-badge" style={{ background: bank?.color || '#f3f4f6' }}>
                      <span className="bank-logo">{bank?.logo || '🏦'}</span>
                    </div>
                    <div className="account-toggle" onClick={(e) => e.stopPropagation()}>
                      <label className="modern-toggle">
                        <input
                          type="checkbox"
                          checked={isIncluded}
                          onChange={(e) => toggleAccountInclusion(account.AccountId, e)}
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
                    <h3 className="account-title">{account.Nickname || bank?.name || account.AccountSubType}</h3>
                    <div className="account-number">•••• {account.AccountId.slice(-4)}</div>
                  </div>
                  
                  <div className="account-card-footer">
                    <div className="balance-info">
                      <span className="balance-label">Balance</span>
                      <div className={`balance-amount ${balance < 0 ? 'negative' : 'positive'}`}>
                        {balance < 0 && '-'}
                        <span className="amount-value">{formatCurrency(balance, account.Currency)}</span>
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
            {Array.from(accountsByBank.entries()).map(([bankId, bankAccounts]) => {
              const bank = getBankInfo(bankId);
              const bankTotal = bankAccounts.reduce((sum, acc) => sum + getAccountBalance(acc.AccountId), 0);
              
              return (
                <div key={bankId} className="bank-group">
                  <div className="bank-group-header">
                    <div className="bank-info-display">
                      <div className="bank-icon-large" style={{ background: bank?.color || '#f3f4f6' }}>
                        {bank?.logo || '🏦'}
                      </div>
                      <div>
                        <h3 className="bank-name">{bank?.name || 'Unknown Bank'}</h3>
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
                      const balance = getAccountBalance(account.AccountId);
                      const isIncluded = includedAccounts.has(account.AccountId);
                      const typeInfo = getAccountTypeInfo(account.AccountSubType);
                      
                      return (
                        <div
                          key={account.AccountId}
                          className={`account-row ${!isIncluded ? 'excluded' : ''}`}
                          onClick={() => navigate(`/model-dataset/account/${account.AccountId}`)}
                        >
                          <div className="account-row-left">
                            <span className="account-type-icon">{typeInfo.icon}</span>
                            <div className="account-row-info">
                              <span className="account-row-name">{account.Nickname || account.AccountSubType}</span>
                              <span className="account-row-number">•••• {account.AccountId.slice(-4)}</span>
                            </div>
                          </div>
                          
                          <div className="account-row-right">
                            <span className={`account-row-balance ${balance < 0 ? 'negative' : ''}`}>
                              {balance < 0 && '-'}{formatCurrency(balance, account.Currency)}
                            </span>
                            <div className="account-row-toggle" onClick={(e) => e.stopPropagation()}>
                              <label className="modern-toggle">
                                <input
                                  type="checkbox"
                                  checked={isIncluded}
                                  onChange={(e) => toggleAccountInclusion(account.AccountId, e)}
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
              const typeTotal = typeAccounts.reduce((sum, acc) => sum + getAccountBalance(acc.AccountId), 0);
              
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
                      const balance = getAccountBalance(account.AccountId);
                      const bank = getBankInfo(account.bankId);
                      const isIncluded = includedAccounts.has(account.AccountId);
                      
                      return (
                        <div
                          key={account.AccountId}
                          className={`account-row ${!isIncluded ? 'excluded' : ''}`}
                          onClick={() => navigate(`/model-dataset/account/${account.AccountId}`)}
                        >
                          <div className="account-row-left">
                            <div className="bank-mini-icon" style={{ background: bank?.color || '#f3f4f6' }}>
                              {bank?.logo || '🏦'}
                            </div>
                            <div className="account-row-info">
                              <span className="account-row-name">{account.Nickname || bank?.name}</span>
                              <span className="account-row-number">•••• {account.AccountId.slice(-4)}</span>
                            </div>
                          </div>
                          
                          <div className="account-row-right">
                            <span className={`account-row-balance ${balance < 0 ? 'negative' : ''}`}>
                              {balance < 0 && '-'}{formatCurrency(balance, account.Currency)}
                            </span>
                            <div className="account-row-toggle" onClick={(e) => e.stopPropagation()}>
                              <label className="modern-toggle">
                                <input
                                  type="checkbox"
                                  checked={isIncluded}
                                  onChange={(e) => toggleAccountInclusion(account.AccountId, e)}
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

      <NetWorthModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        history={netWorthHistory}
        currentNetWorth={totalNetworth}
      />
    </div>
  );
};

export default Accounts;
