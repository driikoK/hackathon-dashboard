import { Link, useLocation, useNavigate } from 'react-router-dom';
import './Sidebar.css';

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Determine if we're on real or model dataset
  const isRealDataset = location.pathname.includes('/real-dataset');
  const baseRoute = isRealDataset ? '/real-dataset' : '/model-dataset';

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <nav className="topbar">
      <div className="topbar-container">
        <div className="topbar-left">
          <div className="logo-section" onClick={() => navigate('/')}>
            <div className="logo-icon">
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                <circle cx="16" cy="16" r="14" fill="url(#gradient)" />
                <path d="M12 16L15 19L20 13" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                <defs>
                  <linearGradient id="gradient" x1="0" y1="0" x2="32" y2="32">
                    <stop offset="0%" stopColor="#667eea" />
                    <stop offset="100%" stopColor="#764ba2" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <h1 className="logo">Dashboard</h1>
          </div>
          
          <div className="nav-links">
            <Link 
              to={`${baseRoute}/accounts`}
              className={`nav-link ${isActive(`${baseRoute}/accounts`) || isActive(`${baseRoute}/account/`) ? 'active' : ''}`}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                <polyline points="9 22 9 12 15 12 15 22"></polyline>
              </svg>
              <span>Accounts</span>
            </Link>
            <Link 
              to={`${baseRoute}/insight`}
              className={`nav-link ${isActive(`${baseRoute}/insight`) ? 'active' : ''}`}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                <line x1="12" y1="22.08" x2="12" y2="12"></line>
              </svg>
              <span>Insights</span>
            </Link>
            {!isRealDataset && (
              <Link 
                to="/model-dataset/calendar" 
                className={`nav-link ${isActive('/model-dataset/calendar') ? 'active' : ''}`}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                  <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
                <span>Calendar</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Sidebar;
