import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import transactionsData from '../db/transactions.json';
import accountsData from '../db/accounts.json';
import './Insight.css';

interface CategoryData {
  name: string;
  amount: number;
  percentage: number;
  icon: string;
  color: string;
}

type ViewType = 'menu' | 'expense' | 'income' | 'cashflow';

const Insight = () => {
  const [selectedMonth, setSelectedMonth] = useState<Date>(new Date());
  const [expenseCategories, setExpenseCategories] = useState<CategoryData[]>([]);
  const [incomeCategories, setIncomeCategories] = useState<CategoryData[]>([]);
  const [totalExpense, setTotalExpense] = useState(0);
  const [totalIncome, setTotalIncome] = useState(0);
  const [currentView, setCurrentView] = useState<ViewType>('menu');
  const [cashflowData, setCashflowData] = useState<any[]>([]);

  // Icon and color mapping for categories - matching transaction icons from AccountDetail
  const getCategoryStyle = (categoryName: string): { icon: string; color: string } => {
    const lowerName = categoryName.toLowerCase();
    
    // Icons matching AccountDetail.tsx transaction icons
    if (lowerName.includes('purchase')) return { icon: '🏪', color: '#FFB84D' };
    if (lowerName.includes('deposit')) return { icon: '💰', color: '#90EE90' };
    if (lowerName.includes('transfer') || lowerName.includes('moneytransfer') || lowerName.includes('internationaltransfer')) return { icon: '🌍', color: '#6BCB77' };
    if (lowerName.includes('withdrawal')) return { icon: '💸', color: '#FFB6C1' };
    if (lowerName.includes('atm')) return { icon: '🏧', color: '#C7B7E8' };
    if (lowerName.includes('bill')) return { icon: '📄', color: '#4ECDC4' };
    if (lowerName.includes('salary')) return { icon: '💼', color: '#90EE90' };
    if (lowerName.includes('payment')) return { icon: '💳', color: '#C7B7E8' };
    if (lowerName.includes('interest')) return { icon: '🌱', color: '#DFF2BF' };
    if (lowerName.includes('fee')) return { icon: '🏛️', color: '#D4F1F4' };
    if (lowerName.includes('charge')) return { icon: '⚡', color: '#FFE5CC' };
    if (lowerName.includes('refund')) return { icon: '↩️', color: '#B4E7CE' };
    if (lowerName.includes('reversal')) return { icon: '🔄', color: '#E8D5F2' };
    if (lowerName.includes('dividend')) return { icon: '💎', color: '#FFE4B5' };
    if (lowerName.includes('loan')) return { icon: '🏦', color: '#FFDDC1' };
    if (lowerName.includes('pos')) return { icon: '🏪', color: '#FFB84D' };
    
    return { icon: '💳', color: '#E0E0E0' };
  };

  useEffect(() => {
    calculateCategories();
  }, [selectedMonth]);

  useEffect(() => {
    // Reset to menu when navigating to Insight from sidebar
    setCurrentView('menu');
  }, []);

  useEffect(() => {
    if (currentView === 'cashflow') {
      calculateCashflow();
    }
  }, [currentView, selectedMonth]);

  const calculateCashflow = () => {
    const year = selectedMonth.getFullYear();
    const userAccountIds = new Set(accountsData.Data.Account.map((acc: any) => acc.AccountId));
    
    // Get data for 6 months
    const monthsData = [];
    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date(year, selectedMonth.getMonth() - i, 1);
      const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
      const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0, 23, 59, 59);
      
      const monthTransactions = transactionsData.Transaction.filter((t: any) => {
        if (!userAccountIds.has(t.AccountId)) return false;
        if (t.Status !== 'Booked') return false;
        
        // Exclude transfers
        const isTransfer = 
          t.TransactionType === 'InternationalTransfer' ||
          t.TransactionType === 'LocalBankTransfer' ||
          t.TransactionType === 'SameBankTransfer' ||
          t.SubTransactionType === 'MoneyTransfer';
        if (isTransfer) return false;
        
        const transDate = new Date(t.TransactionDateTime);
        return transDate >= monthStart && transDate <= monthEnd;
      });

      let income = 0;
      let expense = 0;

      monthTransactions.forEach((t: any) => {
        const amount = parseFloat(t.Amount.Amount);
        if (t.CreditDebitIndicator === 'Credit') {
          income += amount;
        } else {
          expense += amount;
        }
      });

      const savings = income - expense;

      monthsData.push({
        month: monthDate.toLocaleDateString('en-US', { month: 'short' }).toLowerCase(),
        income,
        expense,
        savings,
        date: monthDate
      });
    }

    setCashflowData(monthsData);
  };

  const calculateCategories = () => {
    const monthStart = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 1);
    const monthEnd = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 0, 23, 59, 59);

    // Get user's account IDs
    const userAccountIds = new Set(accountsData.Data.Account.map((acc: any) => acc.AccountId));

    // Filter transactions for the selected month and user's accounts only
    const monthTransactions = transactionsData.Transaction.filter((t: any) => {
      if (!userAccountIds.has(t.AccountId)) return false;
      if (t.Status !== 'Booked') return false;
      
      // Exclude transfers
      const isTransfer = 
        t.TransactionType === 'InternationalTransfer' ||
        t.TransactionType === 'LocalBankTransfer' ||
        t.TransactionType === 'SameBankTransfer' ||
        t.SubTransactionType === 'MoneyTransfer';
      if (isTransfer) return false;
      
      const transDate = new Date(t.TransactionDateTime);
      return transDate >= monthStart && transDate <= monthEnd;
    });

    // Categorize expenses (Debit) and income (Credit) by SubTransactionType
    const expenseMap = new Map<string, number>();
    let expenseTotal = 0;

    const incomeMap = new Map<string, number>();
    let incomeTotal = 0;

    monthTransactions.forEach((t: any) => {
      const amount = parseFloat(t.Amount.Amount);
      const category = t.SubTransactionType || t.TransactionType || 'Other';
      
      if (t.CreditDebitIndicator === 'Debit') {
        // Expenses
        expenseTotal += amount;
        expenseMap.set(category, (expenseMap.get(category) || 0) + amount);
      } else {
        // Income
        incomeTotal += amount;
        incomeMap.set(category, (incomeMap.get(category) || 0) + amount);
      }
    });

    // Convert to array and calculate percentages for expenses
    const expenseArray: CategoryData[] = Array.from(expenseMap.entries()).map(([name, amount]) => {
      const style = getCategoryStyle(name);
      return {
        name,
        amount,
        percentage: expenseTotal > 0 ? Math.round((amount / expenseTotal) * 100) : 0,
        icon: style.icon,
        color: style.color,
      };
    }).sort((a, b) => b.amount - a.amount);

    // Convert to array and calculate percentages for income
    const incomeArray: CategoryData[] = Array.from(incomeMap.entries()).map(([name, amount]) => {
      const style = getCategoryStyle(name);
      return {
        name,
        amount,
        percentage: incomeTotal > 0 ? Math.round((amount / incomeTotal) * 100) : 0,
        icon: style.icon,
        color: style.color,
      };
    }).sort((a, b) => b.amount - a.amount);

    setExpenseCategories(expenseArray);
    setIncomeCategories(incomeArray);
    setTotalExpense(expenseTotal);
    setTotalIncome(incomeTotal);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-AE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatMonthYear = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const changeMonth = (direction: number) => {
    const newDate = new Date(selectedMonth);
    newDate.setMonth(newDate.getMonth() + direction);
    setSelectedMonth(newDate);
  };

  const getTopCategories = (categories: CategoryData[]) => {
    const top3 = categories.slice(0, 3);
    if (top3.length === 0) return '';
    const names = top3.map(c => c.name);
    return `${names.join(', ')} made up ${top3.reduce((sum, c) => sum + c.percentage, 0)}% of your total ${categories === expenseCategories ? 'expense' : 'income'} this month.`;
  };

  const handleBarClick = (data: any) => {
    if (data && data.activePayload && data.activePayload[0]) {
      const clickedData = data.activePayload[0].payload;
      if (clickedData.date) {
        setSelectedMonth(new Date(clickedData.date));
      }
    }
  };

  return (
    <div className="insight-page">
      {currentView === 'menu' && (
        <>
          <h2 className="page-title">Insights</h2>
          <div className="insight-menu">
            <div className="menu-card" onClick={() => setCurrentView('expense')}>
              <div className="menu-icon expense">📉</div>
              <h3 className="menu-title">Expense Category Breakdown</h3>
              <p className="menu-description">View your spending by category</p>
              <svg className="menu-chevron" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </div>
            <div className="menu-card" onClick={() => setCurrentView('income')}>
              <div className="menu-icon income">📈</div>
              <h3 className="menu-title">Income Category Breakdown</h3>
              <p className="menu-description">View your income by category</p>
              <svg className="menu-chevron" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </div>
            <div className="menu-card" onClick={() => setCurrentView('cashflow')}>
              <div className="menu-icon cashflow">📊</div>
              <h3 className="menu-title">Cashflow Analysis</h3>
              <p className="menu-description">Track your income, expenses and savings</p>
              <svg className="menu-chevron" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </div>
          </div>
        </>
      )}

      {currentView === 'expense' && (
        <>
          <button className="back-button" onClick={() => setCurrentView('menu')}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
            Back
          </button>

          <div className="month-selector">
            <button className="month-nav" onClick={() => changeMonth(-1)}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="15 18 9 12 15 6"></polyline>
              </svg>
            </button>
            <h2 className="current-month">{formatMonthYear(selectedMonth)}</h2>
            <button className="month-nav" onClick={() => changeMonth(1)}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </button>
          </div>

          <div className="category-section">
            <h3 className="section-title">Expense Category</h3>
            
            {expenseCategories.length > 0 && (
              <div className="summary-text">
                {getTopCategories(expenseCategories)}
              </div>
            )}

            <div className="total-amount">
              <span className="total-label">TOTAL EXPENSE</span>
              <span className="total-value">-{formatCurrency(totalExpense)} AED</span>
            </div>

            <div className="categories-list">
              {expenseCategories.map((category) => (
                <div key={category.name} className="category-item">
                  <div className="category-header">
                    <div className="category-icon" style={{ backgroundColor: category.color }}>
                      {category.icon}
                    </div>
                    <div className="category-info">
                      <div className="category-name-row">
                        <span className="category-name">
                          {category.name}
                        </span>
                        <span className="category-amount">-{formatCurrency(category.amount)} AED</span>
                      </div>
                      <div className="progress-bar">
                        <div 
                          className="progress-fill" 
                          style={{ 
                            width: `${category.percentage}%`,
                            backgroundColor: category.color 
                          }}
                        />
                      </div>
                      <span className="category-percentage">{category.percentage}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {currentView === 'income' && (
        <>
          <button className="back-button" onClick={() => setCurrentView('menu')}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
            Back
          </button>

          <div className="month-selector">
            <button className="month-nav" onClick={() => changeMonth(-1)}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="15 18 9 12 15 6"></polyline>
              </svg>
            </button>
            <h2 className="current-month">{formatMonthYear(selectedMonth)}</h2>
            <button className="month-nav" onClick={() => changeMonth(1)}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </button>
          </div>

          <div className="category-section">
            <h3 className="section-title">Income Category</h3>
            
            {incomeCategories.length > 0 && (
              <div className="summary-text">
                {getTopCategories(incomeCategories)}
              </div>
            )}

            <div className="total-amount">
              <span className="total-label">TOTAL INCOME</span>
              <span className="total-value income">{formatCurrency(totalIncome)} AED</span>
            </div>

            <div className="categories-list">
              {incomeCategories.map((category) => (
                <div key={category.name} className="category-item">
                  <div className="category-header">
                    <div className="category-icon" style={{ backgroundColor: category.color }}>
                      {category.icon}
                    </div>
                    <div className="category-info">
                      <div className="category-name-row">
                        <span className="category-name">
                          {category.name}
                        </span>
                        <span className="category-amount income">{formatCurrency(category.amount)} AED</span>
                      </div>
                      <div className="progress-bar">
                        <div 
                          className="progress-fill" 
                          style={{ 
                            width: `${category.percentage}%`,
                            backgroundColor: category.color 
                          }}
                        />
                      </div>
                      <span className="category-percentage">{category.percentage}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {currentView === 'cashflow' && (
        <>
          <button className="back-button" onClick={() => setCurrentView('menu')}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
            Back
          </button>

          <div className="month-selector">
            <button className="month-nav" onClick={() => changeMonth(-1)}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="15 18 9 12 15 6"></polyline>
              </svg>
            </button>
            <h2 className="current-month">{formatMonthYear(selectedMonth)}</h2>
            <button className="month-nav" onClick={() => changeMonth(1)}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </button>
          </div>

          <div className="cashflow-section">
            {/* Income vs Expense Chart */}
            <div className="chart-wrapper">
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={cashflowData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }} onClick={handleBarClick}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="month" stroke="#6b7280" style={{ fontSize: '12px' }} />
                  <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
                  <Tooltip 
                    contentStyle={{ 
                      background: '#fff', 
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '14px'
                    }}
                    formatter={(value: number) => formatCurrency(value) + ' AED'}
                  />
                  <Bar dataKey="income" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expense" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Savings Chart */}
            <div className="chart-wrapper">
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={cashflowData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }} onClick={handleBarClick}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="month" stroke="#6b7280" style={{ fontSize: '12px' }} />
                  <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
                  <ReferenceLine y={0} stroke="#9ca3af" strokeWidth={2} />
                  <Tooltip 
                    contentStyle={{ 
                      background: '#fff', 
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '14px'
                    }}
                    formatter={(value: number) => {
                      const sign = value >= 0 ? '+' : '-';
                      return sign + formatCurrency(Math.abs(value)) + ' AED';
                    }}
                  />
                  <Bar dataKey="savings" fill="#3b82f6" radius={[4, 4, 4, 4]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Summary */}
            <div className="cashflow-summary">
              <div className="summary-item">
                <div className="summary-info">
                  <div className="summary-label-row">
                    <span className="legend-dot income"></span>
                    <span className="summary-label">Income</span>
                  </div>
                  <span className="summary-amount income">
                    +{formatCurrency(cashflowData.length > 0 ? cashflowData[cashflowData.length - 1].income : 0)} AED
                  </span>
                </div>
              </div>
              <div className="summary-item">
                <div className="summary-info">
                  <div className="summary-label-row">
                    <span className="legend-dot expense"></span>
                    <span className="summary-label">Expense</span>
                  </div>
                  <span className="summary-amount expense">
                    -{formatCurrency(cashflowData.length > 0 ? cashflowData[cashflowData.length - 1].expense : 0)} AED
                  </span>
                </div>
              </div>
              <div className="summary-item">
                <div className="summary-info">
                  <div className="summary-label-row">
                    <span className="legend-dot savings"></span>
                    <span className="summary-label">Savings</span>
                  </div>
                  <span className="summary-amount savings">
                    {cashflowData.length > 0 && cashflowData[cashflowData.length - 1].savings >= 0 ? '+' : '-'}
                    {formatCurrency(cashflowData.length > 0 ? Math.abs(cashflowData[cashflowData.length - 1].savings) : 0)} AED
                  </span>
                </div>
              </div>
            </div>

            {/* Message */}
            {cashflowData.length > 0 && cashflowData[cashflowData.length - 1].savings > 0 && (
              <div className="cashflow-message">
                <span className="message-highlight">Excellent!</span> You have saved {
                  cashflowData.length > 1 && cashflowData[cashflowData.length - 2].savings > 0
                    ? Math.round((cashflowData[cashflowData.length - 1].savings / cashflowData[cashflowData.length - 2].savings - 1) * 100)
                    : 100
                }% more compared to last month. You have earned {formatCurrency(cashflowData[cashflowData.length - 1].savings)} AED more than you spent
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default Insight;
