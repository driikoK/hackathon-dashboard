import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import standingOrdersData from '../db/standing-orders.json';
import scheduledPaymentsData from '../db/scheduled-payments.json';
import directDebitsData from '../db/debit.json';
import accountsData from '../db/accounts.json';
import './RecurringCalendar.css';

interface UpcomingPayment {
  id: string;
  name: string;
  amount: string;
  currency: string;
  date: Date;
  type: 'debit' | 'standing' | 'scheduled';
  accountId: string;
  frequency?: string;
  status?: string;
}

const RecurringCalendar = () => {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());

  const accounts = accountsData.Data.Account || [];

  const calculateNextPayments = (
    firstPayment: Date,
    frequency: string,
    count: number = 12
  ): Date[] => {
    const payments: Date[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (frequency.startsWith('IntervalDay:')) {
      const days = parseInt(frequency.split(':')[1]);
      let nextDate = new Date(firstPayment);
      while (payments.length < count) {
        if (nextDate >= today) payments.push(new Date(nextDate));
        nextDate.setDate(nextDate.getDate() + days);
      }
    } else if (frequency.startsWith('IntervalWeekDay:')) {
      const weeks = parseInt(frequency.split(':')[1]);
      let nextDate = new Date(firstPayment);
      while (payments.length < count) {
        if (nextDate >= today) payments.push(new Date(nextDate));
        nextDate.setDate(nextDate.getDate() + (weeks * 7));
      }
    } else if (frequency.startsWith('IntervalMonthDay:')) {
      const months = parseInt(frequency.split(':')[1]);
      let nextDate = new Date(firstPayment);
      while (payments.length < count) {
        if (nextDate >= today) payments.push(new Date(nextDate));
        nextDate.setMonth(nextDate.getMonth() + months);
      }
    } else if (frequency === 'EveryDay' || frequency === 'Daily') {
      let nextDate = new Date(firstPayment);
      while (payments.length < count) {
        if (nextDate >= today) payments.push(new Date(nextDate));
        nextDate.setDate(nextDate.getDate() + 1);
      }
    } else if (frequency === 'Weekly') {
      let nextDate = new Date(firstPayment);
      while (payments.length < count) {
        if (nextDate >= today) payments.push(new Date(nextDate));
        nextDate.setDate(nextDate.getDate() + 7);
      }
    } else if (frequency === 'Fortnightly') {
      let nextDate = new Date(firstPayment);
      while (payments.length < count) {
        if (nextDate >= today) payments.push(new Date(nextDate));
        nextDate.setDate(nextDate.getDate() + 14);
      }
    } else if (frequency === 'Monthly') {
      let nextDate = new Date(firstPayment);
      while (payments.length < count) {
        if (nextDate >= today) payments.push(new Date(nextDate));
        nextDate.setMonth(nextDate.getMonth() + 1);
      }
    } else if (frequency === 'Quarterly') {
      let nextDate = new Date(firstPayment);
      while (payments.length < count) {
        if (nextDate >= today) payments.push(new Date(nextDate));
        nextDate.setMonth(nextDate.getMonth() + 3);
      }
    } else if (frequency === 'HalfYearly') {
      let nextDate = new Date(firstPayment);
      while (payments.length < count) {
        if (nextDate >= today) payments.push(new Date(nextDate));
        nextDate.setMonth(nextDate.getMonth() + 6);
      }
    } else if (frequency === 'Annual') {
      let nextDate = new Date(firstPayment);
      while (payments.length < count) {
        if (nextDate >= today) payments.push(new Date(nextDate));
        nextDate.setFullYear(nextDate.getFullYear() + 1);
      }
    }
    return payments;
  };

  const upcomingPayments = useMemo(() => {
    const payments: UpcomingPayment[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    directDebitsData.Data.DirectDebit.forEach((debit) => {
      if (debit.DirectDebitStatusCode === 'Active' && debit.PreviousPaymentDateTime) {
        const lastPayment = new Date(debit.PreviousPaymentDateTime);
        const nextDates = calculateNextPayments(lastPayment, debit.Frequency, 12);
        nextDates.forEach((date) => {
          payments.push({
            id: debit.DirectDebitId,
            name: debit.Name,
            amount: debit.PreviousPaymentAmount?.Amount || '0',
            currency: debit.PreviousPaymentAmount?.Currency || 'AED',
            date,
            type: 'debit',
            accountId: debit.AccountId,
            frequency: debit.Frequency,
            status: debit.DirectDebitStatusCode
          });
        });
      }
    });

    standingOrdersData.Data.StandingOrder.forEach((order) => {
      if (order.StandingOrderStatusCode === 'Active' && order.NextPaymentDateTime) {
        const nextPayment = new Date(order.NextPaymentDateTime);
        if (nextPayment >= today) {
          const nextDates = calculateNextPayments(nextPayment, order.Frequency, 12);
          nextDates.forEach((date) => {
            payments.push({
              id: order.StandingOrderId,
              name: `Standing Order #${order.StandingOrderId.slice(0, 8)}`,
              amount: order.FirstPaymentAmount.Amount,
              currency: order.FirstPaymentAmount.Currency,
              date,
              type: 'standing',
              accountId: order.AccountId,
              frequency: order.Frequency,
              status: order.StandingOrderStatusCode
            });
          });
        }
      }
    });

    scheduledPaymentsData.Data.ScheduledPayment.forEach((payment) => {
      const schedDate = new Date(payment.ScheduledPaymentDateTime);
      if (schedDate >= today) {
        payments.push({
          id: payment.ScheduledPaymentId,
          name: `Scheduled Payment #${payment.ScheduledPaymentId.slice(0, 8)}`,
          amount: payment.InstructedAmount.Amount,
          currency: payment.InstructedAmount.Currency,
          date: schedDate,
          type: 'scheduled',
          accountId: payment.AccountId
        });
      }
    });

    return payments.sort((a, b) => a.date.getTime() - b.date.getTime());
  }, []);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const startingDayOfWeek = firstDayOfMonth.getDay();
  const daysInMonth = lastDayOfMonth.getDate();

  const calendarDays = [];
  
  const prevMonthDays = new Date(year, month, 0).getDate();
  for (let i = startingDayOfWeek - 1; i >= 0; i--) {
    calendarDays.push({
      day: prevMonthDays - i,
      isCurrentMonth: false,
      date: new Date(year, month - 1, prevMonthDays - i)
    });
  }
  
  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push({
      day: i,
      isCurrentMonth: true,
      date: new Date(year, month, i)
    });
  }
  
  const remainingDays = 42 - calendarDays.length;
  for (let i = 1; i <= remainingDays; i++) {
    calendarDays.push({
      day: i,
      isCurrentMonth: false,
      date: new Date(year, month + 1, i)
    });
  }

  const getPaymentsForDate = (date: Date) => {
    const dateStr = date.toDateString();
    return upcomingPayments.filter(p => p.date.toDateString() === dateStr);
  };

  const getTotalForDate = (date: Date) => {
    const payments = getPaymentsForDate(date);
    return payments.reduce((sum, p) => sum + parseFloat(p.amount), 0);
  };

  const formatAmount = (amount: string) => {
    return new Intl.NumberFormat('en-AE', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(parseFloat(amount));
  };

  const getTypeColor = (type: string) => {
    switch(type) {
      case 'debit': return '#667eea';
      case 'standing': return '#f093fb';
      case 'scheduled': return '#43e97b';
      default: return '#64748b';
    }
  };

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const selectedDatePayments = selectedDate ? getPaymentsForDate(selectedDate) : [];
  const selectedDateTotal = selectedDate ? getTotalForDate(selectedDate) : 0;

  const getAccountInfo = (accountId: string) => {
    return accounts.find(acc => acc.AccountId === accountId);
  };

  return (
    <div className="notion-calendar-page">
      <div className="calendar-header-bar">
        <div className="header-left">
          
          <h1 className="calendar-title">Payment Calendar</h1>
        </div>
        <div className="header-right">
          <button className="list-view-btn" onClick={() => navigate('/model-dataset/recurring-payments')}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="8" y1="6" x2="21" y2="6"></line>
              <line x1="8" y1="12" x2="21" y2="12"></line>
              <line x1="8" y1="18" x2="21" y2="18"></line>
            </svg>
            List View
          </button>
        </div>
      </div>

      <div className="calendar-content">
        <div className="calendar-main">
          <div className="calendar-nav">
            <button 
              className="nav-arrow" 
              onClick={() => setCurrentDate(new Date(year, month - 1))}
              disabled={new Date(year, month, 1) <= new Date(new Date().getFullYear(), new Date().getMonth(), 1)}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="15 18 9 12 15 6"></polyline>
              </svg>
            </button>
            <h2 className="month-title">{monthNames[month]} {year}</h2>
            <button className="nav-arrow" onClick={() => setCurrentDate(new Date(year, month + 1))}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </button>
            <button className="today-button" onClick={() => {
              const today = new Date();
              setCurrentDate(today);
              setSelectedDate(today);
            }}>Today</button>
          </div>

          <div className="notion-calendar">
            <div className="weekday-headers">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="weekday-header">{day}</div>
              ))}
            </div>

            <div className="calendar-grid">
              {calendarDays.map((dayObj, index) => {
                const payments = getPaymentsForDate(dayObj.date);
                const hasPayments = payments.length > 0;
                const isSelected = selectedDate?.toDateString() === dayObj.date.toDateString();

                return (
                  <div
                    key={index}
                    className={`day-cell ${!dayObj.isCurrentMonth ? 'other-month' : ''} ${isToday(dayObj.date) ? 'is-today' : ''} ${isSelected ? 'is-selected' : ''}`}
                    onClick={() => setSelectedDate(dayObj.date)}
                  >
                    <span className="day-num">{dayObj.day}</span>
                    {hasPayments && (
                      <div className="payment-dots">
                        {payments.slice(0, 3).map((payment, idx) => (
                          <span
                            key={idx}
                            className="pay-dot"
                            style={{ backgroundColor: getTypeColor(payment.type) }}
                          />
                        ))}
                        {payments.length > 3 && <span className="more-count">+{payments.length - 3}</span>}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="sidebar-panel">
          <div className="sidebar-header">
            <h3 className="sidebar-title">
              {selectedDate ? selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }) : 'Select a date'}
            </h3>
            {selectedDatePayments.length > 0 && (
              <div className="total-badge">{formatAmount(selectedDateTotal.toString())} AED</div>
            )}
          </div>

          <div className="sidebar-content">
            {selectedDatePayments.length === 0 ? (
              <div className="calendar-empty-state">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                  <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
                <p>No payments scheduled</p>
              </div>
            ) : (
              <div className="calendar-payment-list">
                {selectedDatePayments.map((payment) => {
                  const account = getAccountInfo(payment.accountId);
                  return (
                    <div key={payment.id} className="calendar-payment-card">
                      <div className="calendar-payment-type-indicator" style={{ backgroundColor: getTypeColor(payment.type) }} />
                      <div className="calendar-payment-content">
                        <div className="calendar-payment-header">
                          <h4 className="calendar-payment-name">{payment.name}</h4>
                          <span className="calendar-payment-amount">{formatAmount(payment.amount)} {payment.currency}</span>
                        </div>
                        <div className="calendar-payment-meta">
                          {payment.frequency && (
                            <span className="calendar-meta-item">
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10"></circle>
                                <polyline points="12 6 12 12 16 14"></polyline>
                              </svg>
                              {payment.frequency}
                            </span>
                          )}
                          {account && (
                            <span className="calendar-meta-item">
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
                                <line x1="1" y1="10" x2="23" y2="10"></line>
                              </svg>
                              {account.Nickname || account.AccountSubType}
                            </span>
                          )}
                          <span className={`type-badge ${payment.type}`}>
                            {payment.type === 'debit' ? 'Direct Debit' : payment.type === 'standing' ? 'Standing Order' : 'Scheduled'}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecurringCalendar;
