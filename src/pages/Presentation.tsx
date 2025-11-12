import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './Presentation.css';

const Presentation = () => {
  const [currentSection, setCurrentSection] = useState(1);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Check if we have a section in the location state
    if (location.state && typeof location.state.section === 'number') {
      setCurrentSection(location.state.section);
    }
  }, [location.state]);

  useEffect(() => {
    // Smooth scroll to top when section changes
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentSection]);

  const goToSection = (section: number) => {
    setCurrentSection(section);
  };

  return (
    <div className="presentation-container">
      {/* Navigation Dots */}
      <div className="presentation-nav">
        <div 
          className={`nav-dot ${currentSection === 1 ? 'active' : ''}`}
          onClick={() => goToSection(1)}
        />
        <div 
          className={`nav-dot ${currentSection === 2 ? 'active' : ''}`}
          onClick={() => goToSection(2)}
        />
        <div 
          className={`nav-dot ${currentSection === 3 ? 'active' : ''}`}
          onClick={() => goToSection(3)}
        />
        <div 
          className={`nav-dot ${currentSection === 4 ? 'active' : ''}`}
          onClick={() => goToSection(4)}
        />
      </div>

      {/* Section 1: API Connection Process */}
      {currentSection === 1 && (
        <div className="presentation-section section-1">
          <div className="section-content">
            <h1 className="section-title">Open Finance API Integration</h1>
            <p className="section-subtitle">How we fetch and secure your financial data</p>

            <div className="info-grid">
              <div className="info-card">
                <div className="info-icon">🔗</div>
                <h3>API Connection Process</h3>
                <p>
                  We utilize the <strong>Hackathon Starter Kit</strong> to seamlessly connect to Open Finance APIs. 
                  This standardized approach ensures secure and efficient data retrieval from your financial institutions.
                </p>
              </div>

              <div className="info-card">
                <div className="info-icon">🔒</div>
                <h3>Unified Consent Flow</h3>
                <p>
                  This is the <strong>standard unified flow</strong> for all users wanting to use Open Finance to manage their finances. 
                  The same consent process applies across all supported banks, ensuring consistency and security.
                </p>
              </div>
            </div>

            <div className="process-flow">
              <h2 className="flow-title">The Journey: From Consent to Data</h2>
              
              <div className="flow-steps">
                {/* Step 1 & 2 Combined */}
                <div className="flow-step">
                  <div className="step-number">1</div>
                  <div className="step-content">
                    <div className="step-image">
                      <img src="/screenshots/consent.png" alt="Choose option and select bank" />
                    </div>
                    <div className="step-description">
                      <h4>Choose Your Option & Select Bank</h4>
                      <p>Select <strong>Bank Data Sharing</strong> to begin the consent process, then choose your bank from the list below. 
                      You'll be securely redirected to your bank's website or app to authorize the connection.</p>
                    </div>
                  </div>
                </div>

                {/* Step 2 - Login */}
                <div className="flow-step">
                  <div className="step-number">2</div>
                  <div className="step-content">
                    <div className="step-image">
                      <img src="/screenshots/login.png" alt="Bank authorization" />
                    </div>
                    <div className="step-description">
                      <h4>Authorize Securely</h4>
                      <p>Log in through your bank's secure authentication. Your credentials are never 
                      shared with third parties - authentication happens directly with your bank.</p>
                    </div>
                  </div>
                </div>

                {/* Step 3 - Complete */}
                <div className="flow-step">
                  <div className="step-number">3</div>
                  <div className="step-content">
                    <div className="step-image">
                      <img src="/screenshots/complete.png" alt="Consent complete" />
                    </div>
                    <div className="step-description">
                      <h4>Consent Complete</h4>
                      <p>Once authorized, your financial data is securely fetched and ready to be 
                      visualized in your personalized dashboard.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="section-footer">
              <button className="next-button" onClick={() => goToSection(2)}>
                Next: Data Overview
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Section 2: Dataset Overview */}
      {currentSection === 2 && (
        <div className="presentation-section section-2">
          <div className="section-content">
            <h1 className="section-title">Understanding the Data</h1>
            <p className="section-subtitle">What we receive from Open Finance APIs</p>

            <div className="data-info">
              <div className="info-card warning">
                <div className="info-icon">⚠️</div>
                <h3>Model Bank Limitations</h3>
                <p>
                  The data received from <strong>Model Bank</strong> is <strong>not representative</strong> of realistic information provided by actual banks. 
                  It contains random amounts and types, descriptions don't contain useful information and sometimes don't exist at all.
                </p>
              </div>
            </div>

            <div className="data-samples">
              <h2 className="samples-title">Model Bank Data Sample</h2>
              <p className="samples-description">Example of transactions from the sandbox environment:</p>
              
              <div className="table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Field</th>
                      <th>Example 1</th>
                      <th>Example 2</th>
                      <th>Example 3</th>
                      <th>Example 4</th>
                      <th>Example 5</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><strong>TransactionId</strong></td>
                      <td>2WSIT8R...</td>
                      <td>YSBQLRW...</td>
                      <td>4V51ZGV...</td>
                      <td>BJYGPDP...</td>
                      <td>JKF2UE3...</td>
                    </tr>
                    <tr>
                      <td><strong>TransactionType</strong></td>
                      <td>InternationalTransfer</td>
                      <td>POS</td>
                      <td>BillPayments</td>
                      <td>Cheque</td>
                      <td>Other</td>
                    </tr>
                    <tr>
                      <td><strong>SubTransactionType</strong></td>
                      <td>Deposit</td>
                      <td>Purchase</td>
                      <td>DepositReversal</td>
                      <td>Deposit</td>
                      <td>Refund</td>
                    </tr>
                    <tr>
                      <td><strong>Amount</strong></td>
                      <td className="amount-debit">-32,255 AED</td>
                      <td className="amount-debit">-38,126 AED</td>
                      <td className="amount-debit">-25,652 AED</td>
                      <td className="amount-debit">-44,477 AED</td>
                      <td className="amount-credit">+465 AED</td>
                    </tr>
                    <tr>
                      <td><strong>CreditDebitIndicator</strong></td>
                      <td className="status-rejected">Debit</td>
                      <td className="status-rejected">Debit</td>
                      <td className="status-rejected">Debit</td>
                      <td className="status-rejected">Debit</td>
                      <td className="status-booked">Credit</td>
                    </tr>
                    <tr>
                      <td><strong>Status</strong></td>
                      <td className="status-rejected">Rejected</td>
                      <td className="status-pending">Pending</td>
                      <td className="status-pending">Pending</td>
                      <td className="status-rejected">Rejected</td>
                      <td className="status-booked">Booked</td>
                    </tr>
                    <tr>
                      <td><strong>TransactionInfo</strong></td>
                      <td className="no-data">Missing</td>
                      <td className="no-data">Missing</td>
                      <td className="generic-info">Account maintenance fee</td>
                      <td className="generic-info">Medical service payment</td>
                      <td className="no-data">Missing</td>
                    </tr>
                    <tr>
                      <td><strong>DateTime</strong></td>
                      <td>Nov 4, 09:17</td>
                      <td>Nov 5, 23:26</td>
                      <td>Nov 6, 01:01</td>
                      <td>Nov 6, 08:28</td>
                      <td>Nov 6, 10:58</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="data-issues">
                <h3>🔍 Issues Observed:</h3>
                <ul>
                  <li>❌ <strong>Contradictory data:</strong> "InternationalTransfer" + "Deposit" but marked as Debit (withdrawal), "Cheque" + "Deposit" also as Debit</li>
                  <li>❌ <strong>Unrealistic amounts:</strong> 38,126 AED for POS Purchase, 44,477 AED for Cheque Deposit, 25,652 AED for maintenance fee</li>
                  <li>❌ <strong>Missing or generic descriptions:</strong> 3 out of 5 transactions have no TransactionInformation, others contain very generic text like "Account maintenance fee" or "Medical service payment" without any useful details (merchant name, location, etc.)</li>
                  <li>❌ <strong>Random statuses:</strong> Many transactions rejected or pending without clear reason</li>
                  <li>❌ <strong>Inconsistent categorization:</strong> "BillPayments" with subtype "DepositReversal", "Cheque" typed as "Deposit" but actually a withdrawal</li>
                </ul>
              </div>
            </div>

            <div className="realistic-data-section">
              <h2 className="samples-title">Realistic Data Comparison</h2>
              <p className="samples-description">Data obtained using Lean Technologies integrations with actual banks, enhanced with our AI-powered categorization engine:</p>
              
              <div className="table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Field</th>
                      <th>Example 1</th>
                      <th>Example 2</th>
                      <th>Example 3</th>
                      <th>Example 4</th>
                      <th>Example 5</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><strong>Raw Description</strong></td>
                      <td>CARD TRANSACTION 07AUG25 V DEBIT 006837AED 49.00 Card Ending with 4004 Netflix.com A89517135</td>
                      <td>Visa Purchase : 259 0829 706956 LULUHYPERMARKET QUSAIS AED DUBAI AED 5 0829</td>
                      <td>PUR 30/08 DUBAI ELEC DUBAI 1514</td>
                      <td>ETIHAD AIRW 6072412674870 ABU DHABI</td>
                      <td>Visa Purchase : 259 0829 737761 MCDONALDS-AL BUSTAN CN AED DUBAI AED 28 0829</td>
                    </tr>
                    <tr>
                      <td><strong>Cleaned Description</strong></td>
                      <td>Netflix.com</td>
                      <td>Lulu Hypermarket - Qusais</td>
                      <td>Dubai Electricity</td>
                      <td>Etihad Airways</td>
                      <td>McDonald's - Al Bustan</td>
                    </tr>
                    <tr>
                      <td><strong>Merchant Detected</strong></td>
                      <td className="merchant-name">Netflix</td>
                      <td className="merchant-name">Lulu Hypermarket</td>
                      <td className="merchant-name">DEWA</td>
                      <td className="merchant-name">Etihad Airways</td>
                      <td className="merchant-name">McDonald's</td>
                    </tr>
                    <tr>
                      <td><strong>Category</strong></td>
                      <td>Bills / Utilities</td>
                      <td>Food & Dining</td>
                      <td>Bills / Utilities</td>
                      <td>Travel</td>
                      <td>Food & Dining</td>
                    </tr>
                    <tr>
                      <td><strong>SubCategory</strong></td>
                      <td>Cable</td>
                      <td>Groceries</td>
                      <td>Electricity & Water</td>
                      <td>Airline Tickets</td>
                      <td className="no-data">N/A</td>
                    </tr>
                    <tr>
                      <td><strong>Amount</strong></td>
                      <td className="amount-debit">-73.23 AED</td>
                      <td className="amount-debit">-308.50 AED</td>
                      <td className="amount-debit">-419.90 AED</td>
                      <td className="amount-debit">-8,624.19 AED</td>
                      <td className="amount-debit">-28.00 AED</td>
                    </tr>
                    <tr>
                      <td><strong>Status</strong></td>
                      <td className="status-booked">BOOKED</td>
                      <td className="status-booked">BOOKED</td>
                      <td className="status-booked">BOOKED</td>
                      <td className="status-booked">BOOKED</td>
                      <td className="status-booked">BOOKED</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="data-benefits">
                <h3>✅ Improvements with Real Bank Data + Our AI:</h3>
                <ul>
                  <li>✅ <strong>AI-powered merchant detection:</strong> Our engine extracts merchant names from messy bank descriptions (e.g., "LULUHYPERMARKET QUSAIS" → "Lulu Hypermarket")</li>
                  <li>✅ <strong>Smart text cleaning:</strong> Raw descriptions with card numbers, references, and codes are cleaned to human-readable format</li>
                  <li>✅ <strong>Intelligent categorization:</strong> Automatic category and subcategory assignment based on merchant and transaction patterns</li>
                </ul>
              </div>
            </div>

            <div className="conclusion-box">
              <div className="conclusion-icon">💡</div>
              <div className="conclusion-content">
                <h3>Our Approach</h3>
                <p>
                  We will demonstrate our use case with <strong>2 different datasets</strong>:
                </p>
                <ol>
                  <li><strong>Model Bank Dataset</strong> - Sandbox environment data with limitations</li>
                  <li><strong>Realistic Dataset</strong> - More accurate data obtained using Lean Technologies integrations with actual banks, enhanced with our proprietary AI engine for merchant detection, text cleaning, and intelligent categorization</li>
                </ol>
                <p className="conclusion-note">
                  This comparison showcases the difference between test environments and real-world financial data, and demonstrates how our AI transforms raw bank descriptions into actionable insights.
                </p>
              </div>
            </div>

            <div className="section-footer">
              <button className="back-button" onClick={() => goToSection(1)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="15 18 9 12 15 6"></polyline>
                </svg>
                Back
              </button>
              <button className="next-button" onClick={() => goToSection(3)}>
                Next: AI Engine
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Section 3: AI Data Enrichment */}
      {currentSection === 3 && (
        <div className="presentation-section section-3">
          <div className="section-content">
            <h1 className="section-title">AI Model to Clean and Enrich Raw Data</h1>
            <p className="section-subtitle">Transforming messy bank data into actionable insights for banks and fintechs</p>

            <div className="ai-intro">
              <div className="info-card">
                <div className="info-icon">🤖</div>
                <h3>The Challenge for Banks</h3>
                <p>
                  Raw transaction data from banks is often messy, inconsistent, and lacks structured information. 
                  Our AI engine processes this data to extract valuable insights, making it ready for advanced use cases.
                </p>
              </div>
            </div>

            <div className="ai-capabilities">
              <h2 className="capabilities-title">AI Capabilities - Product Suite</h2>
              <p className="capabilities-subtitle">Each capability can be offered as a standalone product to banks:</p>

              <div className="capabilities-grid">
                <div className="capability-card">
                  <div className="capability-icon">✨</div>
                  <h3>1. Cleaning Description</h3>
                  <p>Transform messy bank descriptions into clean, human-readable text</p>
                  <div className="example">
                    <div className="example-before">
                      <span className="label">Before:</span>
                      <code>CARD TRANSACTION 07AUG25 V DEBIT 006837AED 49.00 Card Ending with 4004 Netflix.com A89517135</code>
                    </div>
                    <div className="arrow">→</div>
                    <div className="example-after">
                      <span className="label">After:</span>
                      <strong>Netflix.com</strong>
                    </div>
                  </div>
                </div>

                <div className="capability-card">
                  <div className="capability-icon">🏪</div>
                  <h3>2. Merchant Detection</h3>
                  <p>Automatically identify and extract merchant names from transaction descriptions</p>
                  <div className="example">
                    <div className="example-before">
                      <span className="label">Raw:</span>
                      <code>Visa Purchase : 259 0829 706956 LULUHYPERMARKET QUSAIS AED DUBAI AED 5 0829</code>
                    </div>
                    <div className="arrow">→</div>
                    <div className="example-after">
                      <span className="label">Detected:</span>
                      <strong>Lulu Hypermarket</strong>
                      <span className="location">📍 Qusais, Dubai</span>
                    </div>
                  </div>
                </div>

                <div className="capability-card">
                  <div className="capability-icon">📊</div>
                  <h3>3. Smart Categorization</h3>
                  <p>Intelligent category and subcategory assignment based on merchant and transaction patterns</p>
                  <div className="example">
                    <div className="example-before">
                      <span className="label">Merchant:</span>
                      <strong>DEWA (Dubai Electricity)</strong>
                    </div>
                    <div className="arrow">→</div>
                    <div className="example-after">
                      <span className="label">Categorized:</span>
                      <div className="category-badges">
                        <span className="badge category">Bills / Utilities</span>
                        <span className="badge subcategory">Electricity & Water</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="capability-card">
                  <div className="capability-icon">🎨</div>
                  <h3>4. Merchant Logo</h3>
                  <p>Automatically fetch and assign brand logos for recognized merchants</p>
                  <div className="example merchant-logos">
                    <div className="logo-examples">
                      <div className="logo-item">
                        <div className="logo-placeholder">
                          <img src="https://getcrunchapp-stage-s3-bucket.s3.me-central-1.amazonaws.com/1759173956906_f7fe9ade-68c3-4305-88fd-01792b6472a7.jpeg" alt="McDonald's" />
                        </div>
                        <span>McDonald's</span>
                      </div>
                      <div className="logo-item">
                        <div className="logo-placeholder">
                          <img src="https://getcrunchapp-prod-s3-bucket.s3.me-south-1.amazonaws.com/1762843912382_e32304e5-5163-4370-a1f5-af7bea5f7bc6.png" alt="GMG" />
                        </div>
                        <span>GMG</span>
                      </div>
                      <div className="logo-item">
                        <div className="logo-placeholder">
                          <img src="https://backend.stage.getcrunch.app/merchant_logo/dewa.png" alt="DEWA" />
                        </div>
                        <span>DEWA</span>
                      </div>
                      <div className="logo-item">
                        <div className="logo-placeholder">
                          <img src="https://getcrunchapp-stage-s3-bucket.s3.me-central-1.amazonaws.com/1759173330094_61df4916-7578-40dd-94a0-ca563b7a0913.jpg" alt="Netflix" />
                        </div>
                        <span>Netflix</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="real-examples-section">
              <h2 className="examples-title">Real Transaction Examples</h2>
              <p className="examples-subtitle">Live data from connection ID 11308 processed by our AI engine:</p>

              <div className="transaction-cards">
                <div className="transaction-card">
                  <div className="transaction-header">
                    <div className="merchant-info">
                      <div className="merchant-logo">
                        <img src="https://getcrunchapp-stage-s3-bucket.s3.me-central-1.amazonaws.com/1759171215332_340cbff3-165f-4197-ab55-cecda8206c4e.jpeg" alt="Cafe Bateel" />
                      </div>
                      <div className="merchant-details">
                        <h4>Cafe Bateel</h4>
                        <span className="category-tag">Food & Dining</span>
                      </div>
                    </div>
                    <div className="transaction-amount debit">-85.00 AED</div>
                  </div>
                  <div className="transaction-body">
                    <div className="field-row">
                      <span className="field-label">Raw:</span>
                      <span className="field-value raw">CAFE BATEEL Card purchase</span>
                    </div>
                    <div className="field-row">
                      <span className="field-label">Cleaned:</span>
                      <span className="field-value">Cafe Bateel</span>
                    </div>
                  </div>
                </div>

                <div className="transaction-card">
                  <div className="transaction-header">
                    <div className="merchant-info">
                      <div className="merchant-logo">
                        <img src="https://getcrunchapp-prod-s3-bucket.s3.me-south-1.amazonaws.com/1762843912382_e32304e5-5163-4370-a1f5-af7bea5f7bc6.png" alt="GMG Consumer" />
                      </div>
                      <div className="merchant-details">
                        <h4>GMG Consumer</h4>
                        <span className="category-tag">Shopping</span>
                      </div>
                    </div>
                    <div className="transaction-amount debit">-199.00 AED</div>
                  </div>
                  <div className="transaction-body">
                    <div className="field-row">
                      <span className="field-label">Raw:</span>
                      <span className="field-value raw">GMG CONSUMER Card purchase</span>
                    </div>
                    <div className="field-row">
                      <span className="field-label">Cleaned:</span>
                      <span className="field-value">GMG Consumer</span>
                    </div>
                  </div>
                </div>

                <div className="transaction-card">
                  <div className="transaction-header">
                    <div className="merchant-info">
                      <div className="merchant-logo">
                        <img src="https://getcrunchapp-stage-s3-bucket.s3.me-central-1.amazonaws.com/1759173956906_f7fe9ade-68c3-4305-88fd-01792b6472a7.jpeg" alt="McDonald's" />
                      </div>
                      <div className="merchant-details">
                        <h4>McDonald's</h4>
                        <span className="category-tag">Food & Dining</span>
                      </div>
                    </div>
                    <div className="transaction-amount debit">-28.00 AED</div>
                  </div>
                  <div className="transaction-body">
                    <div className="field-row">
                      <span className="field-label">Raw:</span>
                      <span className="field-value raw">MCDONALDS-ENOC 1033-54 Card purchase</span>
                    </div>
                    <div className="field-row">
                      <span className="field-label">Cleaned:</span>
                      <span className="field-value">McDonald's - ENOC 1033</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="use-cases-section">
              <h2 className="use-cases-title">Unlocking Advanced Use Cases</h2>
              <p className="use-cases-subtitle">Once the data is clean and enriched, banks can build powerful features:</p>

              <div className="use-cases-grid">
                <div className="use-case-card">
                  <div className="use-case-icon">💰</div>
                  <h4>Personal Finance Management</h4>
                  <p>Categorized spending insights, budgeting tools, and smart recommendations</p>
                </div>

                <div className="use-case-card">
                  <div className="use-case-icon">🏦</div>
                  <h4>Lending & Credit Scoring</h4>
                  <p>Accurate income verification, spending patterns, and creditworthiness assessment</p>
                </div>

                <div className="use-case-card">
                  <div className="use-case-icon">✅</div>
                  <h4>Credit & Risk Checks</h4>
                  <p>Detect high-risk spending, gambling patterns, or financial instability</p>
                </div>

                <div className="use-case-card">
                  <div className="use-case-icon">🏪</div>
                  <h4>Merchant Preferences</h4>
                  <p>Understand customer shopping habits and favorite brands</p>
                </div>

                <div className="use-case-card">
                  <div className="use-case-icon">🎁</div>
                  <h4>Loyalty & Discount Programs</h4>
                  <p>Targeted offers based on merchant visits and spending patterns</p>
                </div>

                <div className="use-case-card">
                  <div className="use-case-icon">📊</div>
                  <h4>Fraud Detection</h4>
                  <p>Identify unusual merchant patterns or transaction anomalies</p>
                </div>

                <div className="use-case-card">
                  <div className="use-case-icon">🎯</div>
                  <h4>Marketing & Personalization</h4>
                  <p>Deliver personalized offers and recommendations based on spending behavior</p>
                </div>

                <div className="use-case-card">
                  <div className="use-case-icon">📈</div>
                  <h4>Financial Planning</h4>
                  <p>Cash flow forecasting, savings goals, and investment recommendations</p>
                </div>
              </div>
            </div>

            <div className="ai-conclusion">
              <div className="conclusion-icon">🚀</div>
              <div className="conclusion-content">
                <h3>Transform Your Data Into Value</h3>
                <p>
                  Our AI engine transforms raw, messy bank data into structured, actionable insights. 
                  Each capability can be deployed independently or as a complete suite, enabling banks 
                  to offer cutting-edge financial services to their customers.
                </p>
              </div>
            </div>

            <div className="section-footer">
              <button className="back-button" onClick={() => goToSection(2)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="15 18 9 12 15 6"></polyline>
                </svg>
                Back
              </button>
              <button className="next-button" onClick={() => goToSection(4)}>
                Next: Dashboard
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Section 4: Dashboard Preview */}
      {currentSection === 4 && (
        <div className="presentation-section section-3">
          <div className="section-content">
            <div className="dataset-selection">
              <h2>Choose Dataset</h2>
              <p>Select which dataset to explore in the dashboard:</p>
              <div className="dataset-buttons">
                <button className="dataset-button model" onClick={() => navigate('/model-dataset/accounts')}>
                  <div className="dataset-icon">🏦</div>
                  <h3>Model Bank Dataset</h3>
                  <p>Sandbox environment with limitations</p>
                </button>
                <button className="dataset-button real" onClick={() => navigate('/real-dataset/accounts')}>
                  <div className="dataset-icon">✨</div>
                  <h3>Realistic Dataset</h3>
                  <p>Real bank data with AI enhancements</p>
                </button>
              </div>
            </div>

            <div className="section-footer">
              <button className="back-button" onClick={() => goToSection(3)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="15 18 9 12 15 6"></polyline>
                </svg>
                Back
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Presentation;
