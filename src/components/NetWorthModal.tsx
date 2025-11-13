import { useState } from 'react';
import type { NetWorthHistory } from '../utils/calculateHistory';
import './NetWorthModal.css';

interface NetWorthModalProps {
  isOpen: boolean;
  onClose: () => void;
  history: NetWorthHistory[];
  currentNetWorth: number;
}

const NetWorthModal = ({ isOpen, onClose, history }: NetWorthModalProps) => {
  const [selectedPoint, setSelectedPoint] = useState<NetWorthHistory | null>(null);

  if (!isOpen) return null;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-AE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Math.abs(amount)) + ' AED';
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(date);
  };

  const maxValue = Math.max(...history.map(h => Math.max(h.netWorth, h.assets)));
  const minValue = Math.min(...history.map(h => Math.min(h.netWorth, -h.debt)));
  const range = maxValue - minValue;

  const getY = (value: number) => {
    return ((maxValue - value) / range) * 100;
  };

  const handleChartClick = (e: React.MouseEvent<SVGSVGElement>) => {
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const index = Math.floor((x / rect.width) * history.length);
    
    if (index >= 0 && index < history.length) {
      setSelectedPoint(history[index]);
    }
  };

  const displayPoint = selectedPoint || history[history.length - 1];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{formatCurrency(displayPoint.netWorth)}</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <div className="modal-stats">
          <div className="stat-item">
            <div className="stat-label">Assets</div>
            <div className="stat-value">{formatCurrency(displayPoint.assets)}</div>
          </div>
          <div className="stat-item">
            <div className="stat-label">Debt</div>
            <div className="stat-value debt">-{formatCurrency(displayPoint.debt)}</div>
          </div>
        </div>

        <div className="chart-container">
          <svg
            className="networth-chart"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            onClick={handleChartClick}
          >
            {/* Grid lines */}
            <line x1="0" y1="25" x2="100" y2="25" stroke="#e5e7eb" strokeWidth="0.2" strokeDasharray="1,1" />
            <line x1="0" y1="50" x2="100" y2="50" stroke="#e5e7eb" strokeWidth="0.2" strokeDasharray="1,1" />
            <line x1="0" y1="75" x2="100" y2="75" stroke="#e5e7eb" strokeWidth="0.2" strokeDasharray="1,1" />

            {/* Net Worth line */}
            <polyline
              fill="none"
              stroke="#5b7eff"
              strokeWidth="0.5"
              points={history.map((point, i) => {
                const x = (i / (history.length - 1)) * 100;
                const y = getY(point.netWorth);
                return `${x},${y}`;
              }).join(' ')}
            />

            {/* Area fill */}
            <polygon
              fill="url(#gradient)"
              opacity="0.3"
              points={
                history.map((point, i) => {
                  const x = (i / (history.length - 1)) * 100;
                  const y = getY(point.netWorth);
                  return `${x},${y}`;
                }).join(' ') + ` 100,100 0,100`
              }
            />

            {/* Selected point indicator */}
            {selectedPoint && (
              <circle
                cx={(history.indexOf(selectedPoint) / (history.length - 1)) * 100}
                cy={getY(selectedPoint.netWorth)}
                r="1.5"
                fill="#5b7eff"
              />
            )}

            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#5b7eff" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#5b7eff" stopOpacity="0.1" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        <div className="chart-date-range">
          <div className="date-label">{formatDate(history[0].date)}</div>
          <div className="date-label">6M</div>
          <div className="date-label">{formatDate(history[history.length - 1].date)}</div>
        </div>

        {selectedPoint && (
          <div className="selected-date">{formatDate(selectedPoint.date)}</div>
        )}

        <div className="networth-details">
          <div className="detail-row">
            <span className="detail-label">Change (+/-)</span>
          </div>
          
          <div className="detail-row">
            <span className="detail-label">In assets</span>
            <span className="detail-value positive">
              +{formatCurrency(history[history.length - 1].assets - history[0].assets)}
            </span>
          </div>
          
          <div className="detail-row">
            <span className="detail-label">In debt</span>
            <span className="detail-value negative">
              -{formatCurrency(Math.abs(history[history.length - 1].debt - history[0].debt))}
            </span>
          </div>
          
          <div className="detail-row">
            <span className="detail-label">Networth change</span>
            <span className="detail-value positive">
              +{formatCurrency(history[history.length - 1].netWorth - history[0].netWorth)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NetWorthModal;
