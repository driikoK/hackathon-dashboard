import { useNavigate } from 'react-router-dom';
import './Calendar.css';

const Calendar = () => {
  const navigate = useNavigate();

  return (
    <div className="calendar-page">
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
      <h1>Calendar</h1>
      <p className="coming-soon">Coming soon...</p>
    </div>
  );
};

export default Calendar;
