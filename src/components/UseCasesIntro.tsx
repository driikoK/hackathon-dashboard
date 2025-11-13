import './UseCasesIntro.css';

const UseCasesIntro = () => {
  return (
    <div className="use-cases-intro">
      <h2>Building the Future of Financial Products</h2>
      <p className="subtitle">
        With clean, AI-enriched financial data, we can build powerful tools and services. 
        Each feature below is a standalone product that can transform how banks and fintechs serve their customers.
      </p>

      <div className="products-grid">
        <div className="product-card">
          <div className="product-icon">🤖</div>
          <h3>AI Data Enrichment Engine</h3>
          <p>
            Transform raw bank data into structured insights: clean messy descriptions, detect merchants, 
            assign brand logos, and intelligently categorize transactions automatically.
          </p>
          <span className="product-status">✓ Live Demo</span>
        </div>

        <div className="product-card">
          <div className="product-icon">💰</div>
          <h3>Income/Expense & Category Analytics</h3>
          <p>
            Track cashflow patterns with detailed income and expense breakdowns. Visual category insights 
            show where your money goes and comes from, helping you understand spending habits at a glance.
          </p>
          <span className="product-status">✓ Live Demo</span>
        </div>

        <div className="product-card">
          <div className="product-icon">📈</div>
          <h3>Net Worth Tracking</h3>
          <p>
            Monitor your total wealth across multiple accounts, track assets vs liabilities, and watch your financial growth over time.
          </p>
          <span className="product-status">✓ Live Demo</span>
        </div>
      </div>

      <div className="future-section">
        <h3>🚀 Future Product Roadmap</h3>
        <p>
          With more mature Open Finance infrastructure and our AI engine, we can expand to offer many more valuable services:
        </p>
        
        <div className="future-features">
          <span className="future-tag">🎁 Merchant Discount Codes</span>
          <span className="future-tag">📅 Financial Planning Services</span>
          <span className="future-tag">💡 Financial Advisory Services</span>
          <span className="future-tag">🤝 Investment Partnerships</span>
          <span className="future-tag">📈 Stocks Integration</span>
          <span className="future-tag">₿ Crypto Portfolio Tracking</span>
          <span className="future-tag">🏠 Real Estate Management</span>
          <span className="future-tag">⌚ Luxury Assets (Watches, Art)</span>
          <span className="future-tag">🛡️ Insurance Integration</span>
          <span className="future-tag">🎯 Personalized Offers</span>
          <span className="future-tag">🔮 AI Financial Forecasting</span>
          <span className="future-tag">💳 Credit Score Insights</span>
        </div>

        <p style={{ marginTop: '24px', fontSize: '14px', opacity: 0.85 }}>
          Once Open Finance matures and provides access to more diverse financial data, 
          the possibilities for innovative products and services become limitless.
        </p>
      </div>
    </div>
  );
};

export default UseCasesIntro;
