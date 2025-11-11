import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import accountsData from '../db/accounts.json';
import balancesData from '../db/balances.json';
import banksData from '../db/banks.json';
import type { Account } from '../types';
import { getNetWorthHistory } from '../utils/calculateHistory';
import NetWorthModal from '../components/NetWorthModal';
import './Accounts.css';

const Accounts = () => {
  const navigate = useNavigate();
  const accounts: Account[] = accountsData.Data.Account;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [netWorthHistory, setNetWorthHistory] = useState<any[]>([]);
  const [includedAccounts, setIncludedAccounts] = useState<Set<string>>(() => {
    // Initialize with all accounts included
    return new Set(accounts.map(acc => acc.AccountId));
  });

  useEffect(() => {
    const includedAccountsList = accounts.filter(acc => includedAccounts.has(acc.AccountId));
    const history = getNetWorthHistory(includedAccountsList);
    setNetWorthHistory(history);
  }, [includedAccounts, accounts]);

  const toggleAccountInclusion = (accountId: string, e: React.MouseEvent) => {
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
      (b: any) => b.AccountId === accountId
    );

    if (accountBalances.length === 0) return 0;

    // Find the most recent balance of the highest priority type available
    let latestBalance = null;
    
    for (const type of balanceTypePriority) {
      const balancesOfType = accountBalances.filter((b: any) => b.Type === type);
      if (balancesOfType.length > 0) {
        // Get the most recent balance of this type
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

  // Calculate total networth (only for included accounts)
  const totalNetworth = accounts
    .filter(account => includedAccounts.has(account.AccountId))
    .reduce((sum, account) => {
      return sum + getAccountBalance(account.AccountId);
    }, 0);

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-AE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Math.abs(amount)) + ' ' + currency;
  };

  const getBankInfo = (bankId: number) => {
    return banksData.banks.find((b: any) => b.bankId === bankId);
  };

  const getAccountIcon = (accountType: string) => {
    if (accountType === 'Savings') {
      return '💎';
    } else if (accountType === 'CurrentAccount') {
      return '💳';
    }
    return '💼';
  };

  return (
    <div className="accounts-page">
      <div className="networth-section">
        <h2 className="networth-label">Networth</h2>
        <div className="networth-display">
          <div className="networth-amount">{formatCurrency(totalNetworth, 'AED')}</div>
          <button className="chart-icon-button" onClick={() => setIsModalOpen(true)}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
            </svg>
          </button>
        </div>
      </div>

      <div className="accounts-section">
        <div className="section-header">
          <h3>Accounts</h3>
        </div>

        <div className="accounts-list">
          {accounts.map((account) => {
            const balance = getAccountBalance(account.AccountId);
            const bank = getBankInfo(account.bankId);
            const isIncluded = includedAccounts.has(account.AccountId);
            
            return (
              <div
                key={account.AccountId}
                className="account-card"
                onClick={() => navigate(`/account/${account.AccountId}`)}
              >
                <div className="account-icon" style={{ backgroundColor: bank?.color || '#f3f4f6' }}>
                  {bank?.logo || '🏦'}
                </div>
                <div className="account-info">
                  <div className="account-name">
                    {account.Nickname || account.AccountSubType}
                  </div>
                  <div className="account-balance">
                    {balance < 0 && '-'}
                    {formatCurrency(balance, account.Currency)}
                  </div>
                </div>
                <div className="account-toggle-container">
                  <label className="toggle-switch" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={isIncluded}
                      onChange={(e) => toggleAccountInclusion(account.AccountId, e as any)}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                  <span className="toggle-label">Include in Net Worth</span>
                </div>
                <svg className="chevron" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
              </div>
            );
          })}
        </div>
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
