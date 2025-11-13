import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import transactionsData from '../db/transactions.json';
import accountsData from '../db/accounts.json';
import './Insight.css';

interface CategoryData {
  name: string;
  amount: number;
  percentage: number;
  icon: string;
  color: string;
  count: number;
  [key: string]: string | number;
}

const Insight = () => {
  const navigate = useNavigate();
  const [selectedMonth, setSelectedMonth] = useState<Date>(new Date());
  const [expenseCategories, setExpenseCategories] = useState<CategoryData[]>([]);
  const [incomeCategories, setIncomeCategories] = useState<CategoryData[]>([]);
  const [totalExpense, setTotalExpense] = useState(0);
  const [totalIncome, setTotalIncome] = useState(0);
  const [cashflowData, setCashflowData] = useState<any[]>([]);

  // Color palette for categories
  const CATEGORY_COLORS = [
    '#667eea', '#764ba2', '#f093fb', '#4facfe',
    '#43e97b', '#fa709a', '#fee140', '#30cfd0',
    '#a8edea', '#fed6e3', '#c471f5', '#12c2e9'
  ];

  // Icon mapping for transaction types (filter only meaningful types)
  const getCategoryStyle = (categoryName: string, index: number): { icon: string; color: string } => {
    const lowerName = categoryName.toLowerCase();
    
    // Income categories
    if (lowerName.includes('deposit') || lowerName.includes('credit')) 
      return { icon: '💰', color: CATEGORY_COLORS[index % CATEGORY_COLORS.length] };
    if (lowerName.includes('salary') || lowerName.includes('wage')) 
      return { icon: '💼', color: CATEGORY_COLORS[index % CATEGORY_COLORS.length] };
    if (lowerName.includes('refund') || lowerName.includes('reversal')) 
      return { icon: '↩️', color: CATEGORY_COLORS[index % CATEGORY_COLORS.length] };
    if (lowerName.includes('interest') || lowerName.includes('dividend')) 
      return { icon: '🌱', color: CATEGORY_COLORS[index % CATEGORY_COLORS.length] };
    
    // Expense categories
    if (lowerName.includes('purchase') || lowerName.includes('pos')) 
      return { icon: '🏪', color: CATEGORY_COLORS[index % CATEGORY_COLORS.length] };
    if (lowerName.includes('withdrawal') || lowerName.includes('atm')) 
      return { icon: '💸', color: CATEGORY_COLORS[index % CATEGORY_COLORS.length] };
    if (lowerName.includes('bill') || lowerName.includes('utility')) 
      return { icon: '📄', color: CATEGORY_COLORS[index % CATEGORY_COLORS.length] };
    if (lowerName.includes('fee') || lowerName.includes('charge')) 
      return { icon: '⚡', color: CATEGORY_COLORS[index % CATEGORY_COLORS.length] };
    if (lowerName.includes('payment')) 
      return { icon: '💳', color: CATEGORY_COLORS[index % CATEGORY_COLORS.length] };
    if (lowerName.includes('subscription')) 
      return { icon: '🔄', color: CATEGORY_COLORS[index % CATEGORY_COLORS.length] };
    
    return { icon: '📊', color: CATEGORY_COLORS[index % CATEGORY_COLORS.length] };
  };

  // Filter transactions - exclude transfers and N/A types
  const isValidTransaction = (transaction: any): boolean => {
    // Exclude transfer types
    const transferTypes = [
      'InternationalTransfer',
      'LocalBankTransfer', 
      'SameBankTransfer',
      'MoneyTransfer'
    ];
    
    if (transferTypes.includes(transaction.TransactionType) || 
        transferTypes.includes(transaction.SubTransactionType)) {
      return false;
    }
    
    // Exclude "Not Applicable" or undefined types
    const category = transaction.SubTransactionType || transaction.TransactionType;
    if (!category || category === 'N/A' || category === 'NotApplicable') {
      return false;
    }
    
    return true;
  };

  useEffect(() => {
    calculateCategories();
    calculateCashflow();
  }, [selectedMonth]);

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
        if (!isValidTransaction(t)) return false;
        
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
        month: monthDate.toLocaleDateString('en-US', { month: 'short' }),
        income,
        expense,
        savings
      });
    }

    setCashflowData(monthsData);
  };

  const calculateCategories = () => {
    const monthStart = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 1);
    const monthEnd = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 0, 23, 59, 59);

    const userAccountIds = new Set(accountsData.Data.Account.map((acc: any) => acc.AccountId));

    // Filter transactions
    const monthTransactions = transactionsData.Transaction.filter((t: any) => {
      if (!userAccountIds.has(t.AccountId)) return false;
      if (t.Status !== 'Booked') return false;
      if (!isValidTransaction(t)) return false;
      
      const transDate = new Date(t.TransactionDateTime);
      return transDate >= monthStart && transDate <= monthEnd;
    });

    // Categorize by SubTransactionType (more specific than TransactionType)
    const expenseMap = new Map<string, { amount: number; count: number }>();
    let expenseTotal = 0;

    const incomeMap = new Map<string, { amount: number; count: number }>();
    let incomeTotal = 0;

    monthTransactions.forEach((t: any) => {
      const amount = parseFloat(t.Amount.Amount);
      const category = t.SubTransactionType || t.TransactionType;
      
      if (t.CreditDebitIndicator === 'Debit') {
        expenseTotal += amount;
        const current = expenseMap.get(category) || { amount: 0, count: 0 };
        expenseMap.set(category, { amount: current.amount + amount, count: current.count + 1 });
      } else {
        incomeTotal += amount;
        const current = incomeMap.get(category) || { amount: 0, count: 0 };
        incomeMap.set(category, { amount: current.amount + amount, count: current.count + 1 });
      }
    });

    // Convert to arrays
    const expenseArray: CategoryData[] = Array.from(expenseMap.entries()).map(([name, data], index) => {
      const style = getCategoryStyle(name, index);
      return {
        name,
        amount: data.amount,
        count: data.count,
        percentage: expenseTotal > 0 ? (data.amount / expenseTotal) * 100 : 0,
        icon: style.icon,
        color: style.color,
      };
    }).sort((a, b) => b.amount - a.amount);

    const incomeArray: CategoryData[] = Array.from(incomeMap.entries()).map(([name, data], index) => {
      const style = getCategoryStyle(name, index);
      return {
        name,
        amount: data.amount,
        count: data.count,
        percentage: incomeTotal > 0 ? (data.amount / incomeTotal) * 100 : 0,
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

  // Custom tooltip for pie chart
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="custom-tooltip-insight">
          <div className="tooltip-header">
            <span className="tooltip-icon">{data.icon}</span>
            <span className="tooltip-name">{data.name}</span>
          </div>
          <div className="tooltip-amount">{formatCurrency(data.amount)} AED</div>
          <div className="tooltip-percentage">{data.percentage.toFixed(1)}%</div>
          <div className="tooltip-count">{data.count} transactions</div>
        </div>
      );
    }
    return null;
  };

  const netSavings = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? (netSavings / totalIncome) * 100 : 0;

  return (
    <div className="insight-page-modern">
      {/* Hero Section */}
      <div className="insight-hero-section">
        <div className="insight-hero-content">
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
          <h1 className="insight-page-title">Financial Insights</h1>
          <p className="insight-subtitle">Track your spending patterns and income sources</p>
          
          {/* Month Selector */}
          <div className="month-selector-modern">
            <button className="month-nav-modern" onClick={() => changeMonth(-1)}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="15 18 9 12 15 6"></polyline>
              </svg>
            </button>
            <div className="current-month-modern">{formatMonthYear(selectedMonth)}</div>
            <button className="month-nav-modern" onClick={() => changeMonth(1)}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </button>
          </div>

          {/* Summary Cards */}
          <div className="summary-cards-grid">
            <div className="summary-card-insight income">
              <div className="summary-icon-insight">💰</div>
              <div className="summary-info-insight">
                <div className="summary-label-insight">Total Income</div>
                <div className="summary-value-insight">+{formatCurrency(totalIncome)} AED</div>
              </div>
            </div>
            
            <div className="summary-card-insight expense">
              <div className="summary-icon-insight">💸</div>
              <div className="summary-info-insight">
                <div className="summary-label-insight">Total Expenses</div>
                <div className="summary-value-insight">-{formatCurrency(totalExpense)} AED</div>
              </div>
            </div>
            
            <div className={`summary-card-insight ${netSavings >= 0 ? 'savings-positive' : 'savings-negative'}`}>
              <div className="summary-icon-insight">{netSavings >= 0 ? '📈' : '📉'}</div>
              <div className="summary-info-insight">
                <div className="summary-label-insight">Net Savings</div>
                <div className="summary-value-insight">
                  {netSavings >= 0 ? '+' : ''}{formatCurrency(netSavings)} AED
                </div>
              </div>
            </div>
            
            <div className="summary-card-insight savings-rate">
              <div className="summary-icon-insight">🎯</div>
              <div className="summary-info-insight">
                <div className="summary-label-insight">Savings Rate</div>
                <div className="summary-value-insight">{savingsRate.toFixed(1)}%</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="insight-content-section">
        <div className="insight-content-wrapper">
          
          {/* Category Breakdown - Side by Side */}
          <h2 className="section-title-insight">Category Breakdown</h2>
          
          <div className="categories-container">
            {/* Income Categories */}
            <div className="category-column">
              <div className="category-column-header income">
                <h3 className="category-column-title">
                  <span className="category-icon-title">💰</span>
                  Income Sources
                </h3>
                <div className="category-total">
                  <span className="category-total-label">Total</span>
                  <span className="category-total-amount income">+{formatCurrency(totalIncome)} AED</span>
                </div>
              </div>

              {/* Pie Chart */}
              {incomeCategories.length > 0 && (
                <div className="pie-chart-container">
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie
                        data={incomeCategories}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={2}
                        dataKey="amount"
                      >
                        {incomeCategories.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="pie-chart-center-text">
                    <div className="pie-center-label">Income</div>
                    <div className="pie-center-value">{incomeCategories.length}</div>
                    <div className="pie-center-sublabel">categories</div>
                  </div>
                </div>
              )}

              {/* Categories List */}
              <div className="categories-list-modern">
                {incomeCategories.length === 0 ? (
                  <div className="empty-categories">
                    <div className="empty-icon">📊</div>
                    <p>No income transactions this month</p>
                  </div>
                ) : (
                  incomeCategories.map((category) => (
                    <div key={category.name} className="category-item-modern">
                      <div className="category-item-left">
                        <div className="category-icon-modern" style={{ backgroundColor: category.color }}>
                          {category.icon}
                        </div>
                        <div className="category-details">
                          <div className="category-name-modern">{category.name}</div>
                          <div className="category-count">{category.count} transactions</div>
                        </div>
                      </div>
                      <div className="category-item-right">
                        <div className="category-amount-modern income">+{formatCurrency(category.amount)}</div>
                        <div className="category-percentage-modern">{category.percentage.toFixed(1)}%</div>
                        <div className="category-progress-bar">
                          <div 
                            className="category-progress-fill" 
                            style={{ width: `${category.percentage}%`, backgroundColor: category.color }}
                          />
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Expense Categories */}
            <div className="category-column">
              <div className="category-column-header expense">
                <h3 className="category-column-title">
                  <span className="category-icon-title">💸</span>
                  Expense Categories
                </h3>
                <div className="category-total">
                  <span className="category-total-label">Total</span>
                  <span className="category-total-amount expense">-{formatCurrency(totalExpense)} AED</span>
                </div>
              </div>

              {/* Pie Chart */}
              {expenseCategories.length > 0 && (
                <div className="pie-chart-container">
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie
                        data={expenseCategories}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={2}
                        dataKey="amount"
                      >
                        {expenseCategories.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="pie-chart-center-text">
                    <div className="pie-center-label">Expenses</div>
                    <div className="pie-center-value">{expenseCategories.length}</div>
                    <div className="pie-center-sublabel">categories</div>
                  </div>
                </div>
              )}

              {/* Categories List */}
              <div className="categories-list-modern">
                {expenseCategories.length === 0 ? (
                  <div className="empty-categories">
                    <div className="empty-icon">📊</div>
                    <p>No expense transactions this month</p>
                  </div>
                ) : (
                  expenseCategories.map((category) => (
                    <div key={category.name} className="category-item-modern">
                      <div className="category-item-left">
                        <div className="category-icon-modern" style={{ backgroundColor: category.color }}>
                          {category.icon}
                        </div>
                        <div className="category-details">
                          <div className="category-name-modern">{category.name}</div>
                          <div className="category-count">{category.count} transactions</div>
                        </div>
                      </div>
                      <div className="category-item-right">
                        <div className="category-amount-modern expense">-{formatCurrency(category.amount)}</div>
                        <div className="category-percentage-modern">{category.percentage.toFixed(1)}%</div>
                        <div className="category-progress-bar">
                          <div 
                            className="category-progress-fill" 
                            style={{ width: `${category.percentage}%`, backgroundColor: category.color }}
                          />
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Insights Message */}
          {(incomeCategories.length > 0 || expenseCategories.length > 0) && (
            <div className="insights-message-card">
              <div className="insights-message-icon">💡</div>
              <div className="insights-message-content">
                <h4 className="insights-message-title">Smart Insights</h4>
                <div className="insights-message-text">
                  {netSavings >= 0 ? (
                    <>
                      <span className="highlight-positive">Great job!</span> You saved{' '}
                      <strong>{formatCurrency(netSavings)} AED</strong> this month ({savingsRate.toFixed(1)}% savings rate).
                      {expenseCategories[0] && (
                        <> Your top expense category is <strong>{expenseCategories[0].name}</strong>{' '}
                        ({formatCurrency(expenseCategories[0].amount)} AED, {expenseCategories[0].percentage.toFixed(1)}%).</>
                      )}
                    </>
                  ) : (
                    <>
                      <span className="highlight-negative">Attention needed:</span> You spent{' '}
                      <strong>{formatCurrency(Math.abs(netSavings))} AED</strong> more than you earned this month.
                      {expenseCategories[0] && (
                        <> Consider reviewing <strong>{expenseCategories[0].name}</strong> expenses{' '}
                        ({formatCurrency(expenseCategories[0].amount)} AED).</>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Cashflow Analysis */}
          <h2 className="section-title-insight" style={{ marginTop: '60px' }}>Cashflow Analysis</h2>
          
          <div className="cashflow-charts-container">
            {/* Income vs Expense Chart */}
            <div className="cashflow-chart-card">
              <h3 className="cashflow-chart-title">Income vs Expenses</h3>
              <p className="cashflow-chart-subtitle">Last 6 months comparison</p>
              <div className="chart-wrapper-cashflow">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={cashflowData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="month" stroke="#6b7280" style={{ fontSize: '13px', fontWeight: 600 }} />
                    <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
                    <Tooltip 
                      contentStyle={{ 
                        background: 'white', 
                        border: '2px solid #e5e7eb',
                        borderRadius: '12px',
                        fontSize: '14px',
                        padding: '12px 16px',
                        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)'
                      }}
                      formatter={(value: number) => formatCurrency(value) + ' AED'}
                    />
                    <Legend 
                      wrapperStyle={{ paddingTop: '20px', fontSize: '14px', fontWeight: 600 }}
                      iconType="circle"
                    />
                    <Bar dataKey="income" name="Income" fill="#10b981" radius={[8, 8, 0, 0]} />
                    <Bar dataKey="expense" name="Expenses" fill="#ef4444" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Net Savings Chart */}
            <div className="cashflow-chart-card">
              <h3 className="cashflow-chart-title">Net Savings Trend</h3>
              <p className="cashflow-chart-subtitle">Monthly savings over time</p>
              <div className="chart-wrapper-cashflow">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={cashflowData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="month" stroke="#6b7280" style={{ fontSize: '13px', fontWeight: 600 }} />
                    <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
                    <Tooltip 
                      contentStyle={{ 
                        background: 'white', 
                        border: '2px solid #e5e7eb',
                        borderRadius: '12px',
                        fontSize: '14px',
                        padding: '12px 16px',
                        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)'
                      }}
                      formatter={(value: number) => {
                        const sign = value >= 0 ? '+' : '';
                        return sign + formatCurrency(value) + ' AED';
                      }}
                    />
                    <Bar 
                      dataKey="savings" 
                      name="Savings"
                      fill="#3b82f6" 
                      radius={[8, 8, 8, 8]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Cashflow Summary */}
          {cashflowData.length > 0 && (
            <div className="cashflow-summary-card">
              <h3 className="cashflow-summary-title">Current Month Summary</h3>
              <div className="cashflow-summary-grid">
                <div className="cashflow-summary-item income">
                  <div className="cashflow-summary-icon">💰</div>
                  <div className="cashflow-summary-info">
                    <div className="cashflow-summary-label">Total Income</div>
                    <div className="cashflow-summary-value">+{formatCurrency(cashflowData[cashflowData.length - 1].income)} AED</div>
                  </div>
                </div>
                
                <div className="cashflow-summary-item expense">
                  <div className="cashflow-summary-icon">💸</div>
                  <div className="cashflow-summary-info">
                    <div className="cashflow-summary-label">Total Expenses</div>
                    <div className="cashflow-summary-value">-{formatCurrency(cashflowData[cashflowData.length - 1].expense)} AED</div>
                  </div>
                </div>
                
                <div className={`cashflow-summary-item ${cashflowData[cashflowData.length - 1].savings >= 0 ? 'savings' : 'deficit'}`}>
                  <div className="cashflow-summary-icon">{cashflowData[cashflowData.length - 1].savings >= 0 ? '📈' : '📉'}</div>
                  <div className="cashflow-summary-info">
                    <div className="cashflow-summary-label">Net Savings</div>
                    <div className="cashflow-summary-value">
                      {cashflowData[cashflowData.length - 1].savings >= 0 ? '+' : ''}
                      {formatCurrency(cashflowData[cashflowData.length - 1].savings)} AED
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default Insight;

