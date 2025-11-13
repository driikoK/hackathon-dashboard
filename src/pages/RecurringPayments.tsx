import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import standingOrdersData from '../db/standing-orders.json';
import scheduledPaymentsData from '../db/scheduled-payments.json';
import directDebitsData from '../db/debit.json';
import accountsData from '../db/accounts.json';
import './RecurringPayments.css';

type TabType = 'debits' | 'scheduled' | 'standing';

const RecurringPayments = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('debits');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  const scheduledPayments = scheduledPaymentsData.Data.ScheduledPayment || [];
  const standingOrders = standingOrdersData.Data.StandingOrder || [];
  const directDebits = directDebitsData.Data.DirectDebit || [];
  const accounts = accountsData.Data.Account || [];

  const getAccountInfo = (accountId: string) => {
    return accounts.find(acc => acc.AccountId === accountId);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatAmount = (amount: string) => {
    return new Intl.NumberFormat('en-AE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(parseFloat(amount));
  };

  const filteredDebits = (statusFilter === 'all' 
    ? directDebits 
    : directDebits.filter(d => d.DirectDebitStatusCode.toLowerCase() === statusFilter))
    .sort((a, b) => {
      if (a.DirectDebitStatusCode === 'Active' && b.DirectDebitStatusCode !== 'Active') return -1;
      if (a.DirectDebitStatusCode !== 'Active' && b.DirectDebitStatusCode === 'Active') return 1;
      return 0;
    });

  const sortedStandingOrders = [...standingOrders].sort((a, b) => {
    if (a.StandingOrderStatusCode === 'Active' && b.StandingOrderStatusCode !== 'Active') return -1;
    if (a.StandingOrderStatusCode !== 'Active' && b.StandingOrderStatusCode === 'Active') return 1;
    return 0;
  });

  const activeDebits = directDebits.filter(d => d.DirectDebitStatusCode === 'Active').length;
  const activeStandingOrders = standingOrders.filter(s => s.StandingOrderStatusCode === 'Active').length;

  return (
    <div className="recurring-payments-page">
      <div className="recurring-hero">
        <div className="recurring-hero-content">
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
          <h1>Recurring & Scheduled Payments</h1>
          <p>Manage all your automatic payments, subscriptions, and scheduled transactions in one place</p>
          
          <div className="hero-stats">
            <div className="stat-card">
              <div className="stat-value">{scheduledPayments.length}</div>
              <div className="stat-label">Scheduled Payments</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{activeStandingOrders}/{standingOrders.length}</div>
              <div className="stat-label">Active Standing Orders</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{activeDebits}/{directDebits.length}</div>
              <div className="stat-label">Active Direct Debits</div>
            </div>
          </div>

          <button 
            className="calendar-view-btn" 
            onClick={() => navigate('/recurring-calendar')}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
            <span>View Calendar</span>
          </button>
        </div>
      </div>

      <div className="recurring-content">
        <div className="tabs-container">
        <button 
          className={`tab-button ${activeTab === 'debits' ? 'active' : ''}`}
          onClick={() => setActiveTab('debits')}
        >
          <span>💳</span>
          <span>Direct Debits ({directDebits.length})</span>
        </button>
        <button 
          className={`tab-button ${activeTab === 'scheduled' ? 'active' : ''}`}
          onClick={() => setActiveTab('scheduled')}
        >
          <span>📅</span>
          <span>Scheduled Payments ({scheduledPayments.length})</span>
        </button>
        <button 
          className={`tab-button ${activeTab === 'standing' ? 'active' : ''}`}
          onClick={() => setActiveTab('standing')}
        >
          <span>🔄</span>
          <span>Standing Orders ({standingOrders.length})</span>
        </button>
      </div>

      {activeTab === 'debits' && (
        <div className="filter-section">
          <span style={{ fontSize: '14px', fontWeight: 600, color: '#64748b' }}>Filter by status:</span>
          <button 
            className={`filter-button ${statusFilter === 'all' ? 'active' : ''}`}
            onClick={() => setStatusFilter('all')}
          >
            All ({directDebits.length})
          </button>
          <button 
            className={`filter-button ${statusFilter === 'active' ? 'active' : ''}`}
            onClick={() => setStatusFilter('active')}
          >
            Active ({activeDebits})
          </button>
          <button 
            className={`filter-button ${statusFilter === 'inactive' ? 'active' : ''}`}
            onClick={() => setStatusFilter('inactive')}
          >
            Inactive ({directDebits.length - activeDebits})
          </button>
        </div>
      )}

      {/* Direct Debits Tab */}
      {activeTab === 'debits' && (
        <div className="payments-grid">
          {filteredDebits.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">💳</div>
              <h3>No {statusFilter !== 'all' ? statusFilter : ''} direct debits found</h3>
              <p>Try adjusting your filters to see more results</p>
            </div>
          ) : (
            filteredDebits.map((debit) => {
              const account = getAccountInfo(debit.AccountId);
              return (
              <div key={debit.DirectDebitId} className="payment-card">
                <div className="payment-header">
                  <div className="payment-info">
                    <h3>{debit.Name}</h3>
                    <div className="payment-meta">
                      <span className={`status-badge ${debit.DirectDebitStatusCode.toLowerCase()}`}>
                        {debit.DirectDebitStatusCode}
                      </span>
                      <span className="frequency-badge">
                        {debit.Frequency}
                      </span>
                      {account && (
                        <span className="account-badge" title={`${account.AccountHolderName} - ${account.Nickname || account.AccountSubType}`}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
                            <line x1="1" y1="10" x2="23" y2="10"></line>
                          </svg>
                          {account.Nickname || account.AccountSubType}
                        </span>
                      )}
                    </div>
                  </div>
                  {debit.PreviousPaymentAmount && (
                    <div className="payment-amount">
                      <div className="amount-value">
                        {formatAmount(debit.PreviousPaymentAmount.Amount)} AED
                      </div>
                      <div className="amount-label">Last Payment</div>
                    </div>
                  )}
                </div>

                <div className="payment-details">
                  <div className="detail-item">
                    <div className="detail-label">Mandate ID</div>
                    <div className="detail-value">{debit.MandateIdentification}</div>
                  </div>
                  <div className="detail-item">
                    <div className="detail-label">Direct Debit ID</div>
                    <div className="detail-value">{debit.DirectDebitId}</div>
                  </div>
                  {debit.PreviousPaymentDateTime && (
                    <div className="detail-item">
                      <div className="detail-label">Last Payment Date</div>
                      <div className="detail-value">{formatDate(debit.PreviousPaymentDateTime)}</div>
                    </div>
                  )}
                  <div className="detail-item">
                    <div className="detail-label">Frequency</div>
                    <div className="detail-value">{debit.Frequency}</div>
                  </div>
                </div>
              </div>
            );
            })
          )}
        </div>
      )}

      {/* Scheduled Payments Tab */}
      {activeTab === 'scheduled' && (
        <div className="payments-grid">
          {scheduledPayments.map((payment) => {
            const account = getAccountInfo(payment.AccountId);
            return (
            <div key={payment.ScheduledPaymentId} className="payment-card">
              <div className="payment-header">
                <div className="payment-info">
                  <h3>Payment #{payment.ScheduledPaymentId}</h3>
                  <div className="payment-meta">
                    <span className="payment-type-badge execution">
                      {payment.ScheduledType}
                    </span>
                    <span className="meta-tag">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                        <line x1="16" y1="2" x2="16" y2="6"></line>
                        <line x1="8" y1="2" x2="8" y2="6"></line>
                        <line x1="3" y1="10" x2="21" y2="10"></line>
                      </svg>
                      {formatDate(payment.ScheduledPaymentDateTime)}
                    </span>
                    {account && (
                      <span className="account-badge" title={`${account.AccountHolderName} - ${account.Nickname || account.AccountSubType}`}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
                          <line x1="1" y1="10" x2="23" y2="10"></line>
                        </svg>
                        {account.Nickname || account.AccountSubType}
                      </span>
                    )}
                  </div>
                </div>
                <div className="payment-amount">
                  <div className="amount-value">
                    {formatAmount(payment.InstructedAmount.Amount)} AED
                  </div>
                  <div className="amount-label">Scheduled Amount</div>
                </div>
              </div>

              {payment.DebtorReference && (
                <div className="payment-details">
                  <div className="detail-item">
                    <div className="detail-label">Reference</div>
                    <div className="detail-value">{payment.DebtorReference}</div>
                  </div>
                </div>
              )}

              {(payment.CreditorAgent || payment.CreditorAccount) && (
                <div className="creditor-info">
                  <h4>Recipient Details</h4>
                  <div className="creditor-details">
                    {payment.CreditorAgent && (
                      <div className="creditor-row">
                        <span className="label">Bank:</span>
                        <span className="value">{payment.CreditorAgent.Identification}</span>
                      </div>
                    )}
                    {payment.CreditorAccount && payment.CreditorAccount.map((account, idx) => (
                      <div key={idx} className="creditor-row">
                        <span className="label">{account.SchemeName}:</span>
                        <span className="value">{account.Identification}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
          })}
        </div>
      )}

      {/* Standing Orders Tab */}
      {activeTab === 'standing' && (
        <div className="payments-grid">
          {sortedStandingOrders.map((order) => {
            const account = getAccountInfo(order.AccountId);
            return (
            <div key={order.StandingOrderId} className="payment-card">
              <div className="payment-header">
                <div className="payment-info">
                  <h3>Standing Order #{order.StandingOrderId}</h3>
                  <div className="payment-meta">
                    <span className={`status-badge ${order.StandingOrderStatusCode.toLowerCase()}`}>
                      {order.StandingOrderStatusCode}
                    </span>
                    <span className="frequency-badge">
                      {order.Frequency}
                    </span>
                    {account && (
                      <span className="account-badge" title={`${account.AccountHolderName} - ${account.Nickname || account.AccountSubType}`}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
                          <line x1="1" y1="10" x2="23" y2="10"></line>
                        </svg>
                        {account.Nickname || account.AccountSubType}
                      </span>
                    )}
                  </div>
                </div>
                <div className="payment-amount">
                  <div className="amount-value">
                    {formatAmount(order.FirstPaymentAmount.Amount)} AED
                  </div>
                  <div className="amount-label">First Payment</div>
                </div>
              </div>

              <div className="payment-details">
                <div className="detail-item">
                  <div className="detail-label">Standing Order ID</div>
                  <div className="detail-value">{order.StandingOrderId}</div>
                </div>
                <div className="detail-item">
                  <div className="detail-label">First Payment Date</div>
                  <div className="detail-value">{formatDate(order.FirstPaymentDateTime)}</div>
                </div>
                {order.NextPaymentDateTime && (
                  <div className="detail-item">
                    <div className="detail-label">Next Payment</div>
                    <div className="detail-value">{formatDate(order.NextPaymentDateTime)}</div>
                  </div>
                )}
                {order.NumberOfPayments && (
                  <div className="detail-item">
                    <div className="detail-label">Number of Payments</div>
                    <div className="detail-value">{order.NumberOfPayments}</div>
                  </div>
                )}
                {order.StandingOrderType && (
                  <div className="detail-item">
                    <div className="detail-label">Type</div>
                    <div className="detail-value">{order.StandingOrderType}</div>
                  </div>
                )}
              </div>

              {(order.CreditorAgent || order.CreditorAccount) && (
                <div className="creditor-info">
                  <h4>Creditor Information</h4>
                  <div className="creditor-details">
                    {order.CreditorAgent && (
                      <div className="creditor-row">
                        <span className="label">Bank:</span>
                        <span className="value">{order.CreditorAgent.Identification}</span>
                      </div>
                    )}
                    {order.CreditorAccount && order.CreditorAccount.map((account, idx) => (
                      <div key={idx} className="creditor-row">
                        <span className="label">{account.SchemeName}:</span>
                        <span className="value">{account.Identification}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
          })}
        </div>
      )}
      </div>
    </div>
  );
};

export default RecurringPayments;
