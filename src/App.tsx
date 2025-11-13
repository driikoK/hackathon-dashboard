import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import ScrollToTop from './components/ScrollToTop';
import Presentation from './pages/Presentation';
import Accounts from './pages/Accounts';
import AccountDetail from './pages/AccountDetail';
import Insight from './pages/Insight';
import RecurringPayments from './pages/RecurringPayments';
import AccountsReal from './pages/AccountsReal';
import AccountDetailReal from './pages/AccountDetailReal';
import InsightReal from './pages/InsightReal';
import './App.css';

function App() {
  return (
    <Router>
      <ScrollToTop />
      <Routes>
        {/* Presentation route without sidebar */}
        <Route path="/" element={<Presentation />} />
        
        {/* Dashboard routes with sidebar */}
        <Route path="/*" element={
          <div className="app">
            <Sidebar />
            <main className="main-content">
              <Routes>
                <Route path="/model-dataset/accounts" element={<Accounts />} />
                <Route path="/model-dataset/account/:accountId" element={<AccountDetail />} />
                <Route path="/model-dataset/insight" element={<Insight />} />
                <Route path="/model-dataset/recurring-payments" element={<RecurringPayments />} />
                <Route path="/real-dataset/accounts" element={<AccountsReal />} />
                <Route path="/real-dataset/account/:accountId" element={<AccountDetailReal />} />
                <Route path="/real-dataset/insight" element={<InsightReal />} />
              </Routes>
            </main>
          </div>
        } />
      </Routes>
    </Router>
  );
}

export default App;
