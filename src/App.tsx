import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Accounts from './pages/Accounts';
import AccountDetail from './pages/AccountDetail';
import Insight from './pages/Insight';
import Calendar from './pages/Calendar';
import './App.css';

function App() {
  return (
    <Router>
      <div className="app">
        <Sidebar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Accounts />} />
            <Route path="/account/:accountId" element={<AccountDetail />} />
            <Route path="/insight" element={<Insight />} />
            <Route path="/calendar" element={<Calendar />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
