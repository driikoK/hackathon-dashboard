import './PageLoader.css';

const PageLoader = () => {
  return (
    <div className="page-loader-overlay">
      <div className="page-loader-content">
        <div className="loader-spinner">
          <div className="spinner-ring"></div>
          <div className="spinner-ring"></div>
          <div className="spinner-ring"></div>
        </div>
        <h2 className="loader-title">Loading Dashboard</h2>
        <p className="loader-subtitle">Preparing your financial overview...</p>
      </div>
    </div>
  );
};

export default PageLoader;
