import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import transactionsData from '../db/transactions-real.json';
import accountsData from '../db/accounts-real.json';
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

const InsightReal = () => {
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

  // Icon mapping for transaction categories
  const getCategoryStyle = (categoryName: string, index: number): { icon: string; color: string } => {
    const lowerName = categoryName.toLowerCase();
    
    // Income categories
    if (lowerName.includes('income')) 
      return { icon: '💰', color: CATEGORY_COLORS[index % CATEGORY_COLORS.length] };
    if (lowerName.includes('salary') || lowerName.includes('wage')) 
      return { icon: '💼', color: CATEGORY_COLORS[index % CATEGORY_COLORS.length] };
    if (lowerName.includes('refund')) 
      return { icon: '↩️', color: CATEGORY_COLORS[index % CATEGORY_COLORS.length] };
    
    // Expense categories
    if (lowerName.includes('food') || lowerName.includes('dining')) 
      return { icon: '🍽️', color: CATEGORY_COLORS[index % CATEGORY_COLORS.length] };
    if (lowerName.includes('shopping')) 
      return { icon: '🛍️', color: CATEGORY_COLORS[index % CATEGORY_COLORS.length] };
    if (lowerName.includes('transport')) 
      return { icon: '🚗', color: CATEGORY_COLORS[index % CATEGORY_COLORS.length] };
    if (lowerName.includes('bill') || lowerName.includes('utility')) 
      return { icon: '📄', color: CATEGORY_COLORS[index % CATEGORY_COLORS.length] };
    if (lowerName.includes('entertainment')) 
      return { icon: '🎬', color: CATEGORY_COLORS[index % CATEGORY_COLORS.length] };
    if (lowerName.includes('health')) 
      return { icon: '⚕️', color: CATEGORY_COLORS[index % CATEGORY_COLORS.length] };
    if (lowerName.includes('travel')) 
      return { icon: '✈️', color: CATEGORY_COLORS[index % CATEGORY_COLORS.length] };
    
    return { icon: '📊', color: CATEGORY_COLORS[index % CATEGORY_COLORS.length] };
  };

  useEffect(() => {
    calculateCategories();
    calculateCashflow();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMonth]);

  const changeMonth = (direction: number) => {
    setSelectedMonth(prevMonth => {
      const newMonth = new Date(prevMonth);
      newMonth.setMonth(prevMonth.getMonth() + direction);
      return newMonth;
    });
  };

  const calculateCategories = () => {
    const year = selectedMonth.getFullYear();
    const month = selectedMonth.getMonth();
    const monthStart = new Date(year, month, 1);
    const monthEnd = new Date(year, month + 1, 0, 23, 59, 59);
    
    const userAccountIds = new Set(accountsData.data.map((acc: any) => acc.id));
    
    const validTransactions = transactionsData.data.filter((t: any) => {
      if (!userAccountIds.has(t.accountId)) return false;
      if (t.status !== 'POSTED') return false;
      
      const transDate = new Date(t.transactionDate);
      return transDate >= monthStart && transDate <= monthEnd;
    });

    const expenseMap = new Map<string, { amount: number; count: number }>();
    const incomeMap = new Map<string, { amount: number; count: number }>();
    
    let totalExp = 0;
    let totalInc = 0;
    
    validTransactions.forEach((t: any) => {
      const amount = Math.abs(parseFloat(t.amount));
      const categoryName = t.category?.name || 'Uncategorized';
      
      if (t.type === 'EXPENSE') {
        totalExp += amount;
        const current = expenseMap.get(categoryName) || { amount: 0, count: 0 };
        expenseMap.set(categoryName, {
          amount: current.amount + amount,
          count: current.count + 1
        });
      } else if (t.type === 'INCOME') {
        totalInc += amount;
        const current = incomeMap.get(categoryName) || { amount: 0, count: 0 };
        incomeMap.set(categoryName, {
          amount: current.amount + amount,
          count: current.count + 1
        });
      }
    });

    setTotalExpense(totalExp);
    setTotalIncome(totalInc);

    const expenseCats: CategoryData[] = Array.from(expenseMap.entries())
      .map(([name, data], index) => {
        const style = getCategoryStyle(name, index);
        return {
          name,
          amount: data.amount,
          count: data.count,
          percentage: (data.amount / totalExp) * 100,
          icon: style.icon,
          color: style.color
        };
      })
      .sort((a, b) => b.amount - a.amount);

    const incomeCats: CategoryData[] = Array.from(incomeMap.entries())
      .map(([name, data], index) => {
        const style = getCategoryStyle(name, index);
        return {
          name,
          amount: data.amount,
          count: data.count,
          percentage: (data.amount / totalInc) * 100,
          icon: style.icon,
          color: style.color
        };
      })
      .sort((a, b) => b.amount - a.amount);

    setExpenseCategories(expenseCats);
    setIncomeCategories(incomeCats);
  };

  const calculateCashflow = () => {
    const year = selectedMonth.getFullYear();
    const month = selectedMonth.getMonth();
    const userAccountIds = new Set(accountsData.data.map((acc: any) => acc.id));
    
    // Group transactions by month
    const monthlyData = new Map<string, { income: number; expense: number }>();
    
    transactionsData.data.forEach((t: any) => {
      if (!userAccountIds.has(t.accountId)) return;
      if (t.status !== 'POSTED') return;
      
      const date = new Date(t.transactionDate);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthLabel = date.toLocaleDateString('en-US', { month: 'short' });
      
      const amount = Math.abs(parseFloat(t.amount));
      const current = monthlyData.get(monthKey) || { income: 0, expense: 0, label: monthLabel };
      
      if (t.type === 'INCOME') {
        current.income += amount;
      } else if (t.type === 'EXPENSE') {
        current.expense += amount;
      }
      
      monthlyData.set(monthKey, current);
    });

    // Get the current month from data or use current date
    const currentDate = monthlyData.size > 0 
      ? new Date(Array.from(monthlyData.keys())[0] + '-01')
      : new Date();
    
    // Generate last 6 months (including months with no data)
    const monthsArray = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date(currentDate);
      date.setMonth(date.getMonth() - i);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthLabel = date.toLocaleDateString('en-US', { month: 'short' });
      
      const data = monthlyData.get(monthKey) || { income: 0, expense: 0 };
      
      monthsArray.push({
        month: monthLabel,
        income: data.income || 0,
        expense: data.expense || 0,
        savings: (data.income || 0) - (data.expense || 0)
      });
    }

    setCashflowData(monthsArray);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-AE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
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
            <h2 className="current-month-modern">
              {selectedMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </h2>
            <button className="month-nav-modern" onClick={() => changeMonth(1)}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </button>
          </div>

          {/* Summary Cards */}
          <div className="summary-cards-grid" style={{ marginTop: '32px' }}>
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
                    <p>No income transactions</p>
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
                    <p>No expense transactions</p>
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
                      <strong>{formatCurrency(netSavings)} AED</strong> ({savingsRate.toFixed(1)}% savings rate).
                      {expenseCategories[0] && (
                        <> Your top expense category is <strong>{expenseCategories[0].name}</strong>{' '}
                        ({formatCurrency(expenseCategories[0].amount)} AED, {expenseCategories[0].percentage.toFixed(1)}%).</>
                      )}
                    </>
                  ) : (
                    <>
                      <span className="highlight-negative">Attention needed:</span> You spent{' '}
                      <strong>{formatCurrency(Math.abs(netSavings))} AED</strong> more than you earned.
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
              <p className="cashflow-chart-subtitle">Monthly comparison</p>
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
                        if (value === 0) return 'No data - 0.00 AED';
                        return formatCurrency(value) + ' AED';
                      }}
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
                        if (value === 0) return 'No data - 0.00 AED';
                        const sign = value >= 0 ? '+' : '';
                        return sign + formatCurrency(Math.abs(value)) + ' AED';
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
              <h3 className="cashflow-summary-title">Overall Summary</h3>
              <div className="cashflow-summary-grid">
                <div className="cashflow-summary-item income">
                  <div className="cashflow-summary-icon">💰</div>
                  <div className="cashflow-summary-info">
                    <div className="cashflow-summary-label">Total Income</div>
                    <div className="cashflow-summary-value">+{formatCurrency(totalIncome)} AED</div>
                  </div>
                </div>
                
                <div className="cashflow-summary-item expense">
                  <div className="cashflow-summary-icon">💸</div>
                  <div className="cashflow-summary-info">
                    <div className="cashflow-summary-label">Total Expenses</div>
                    <div className="cashflow-summary-value">-{formatCurrency(totalExpense)} AED</div>
                  </div>
                </div>
                
                <div className={`cashflow-summary-item ${netSavings >= 0 ? 'savings' : 'deficit'}`}>
                  <div className="cashflow-summary-icon">{netSavings >= 0 ? '📈' : '📉'}</div>
                  <div className="cashflow-summary-info">
                    <div className="cashflow-summary-label">Net Savings</div>
                    <div className="cashflow-summary-value">
                      {netSavings >= 0 ? '+' : ''}
                      {formatCurrency(netSavings)} AED
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

export default InsightReal;
