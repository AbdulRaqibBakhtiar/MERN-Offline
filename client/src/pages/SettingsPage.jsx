// src/pages/SettingsPage.jsx
import React from 'react';

const SettingsPage = ({ theme = 'light', setTheme }) => {
  const toggleTheme = () => {
    if (typeof setTheme === 'function') {
      setTheme((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'));
    }
  };

  return (
    <div className="card" style={{ transition: 'background-color 0.3s ease, color 0.3s ease' }}>
      <h2 className="sub-header" style={{ margin: '0 0 20px 0', transition: 'color 0.3s ease' }}>
        Application Settings
      </h2>
      <div style={{ marginTop: '15px' }}>
        
        {/* Theme Control */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0', borderBottom: '1px solid var(--border-color)', transition: 'border-color 0.3s ease' }}>
          <div>
            <strong style={{ display: 'block', fontSize: '15px' }}>
              System Theme Mode
            </strong>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)', transition: 'color 0.3s ease' }}>
              Switch between bright visual layouts or a dark-room night mode interface.
            </span>
          </div>
          <button 
            onClick={toggleTheme} 
            style={{ 
              padding: '8px 16px', 
              cursor: 'pointer', 
              backgroundColor: theme === 'light' ? '#1e1e24' : '#0070f3', 
              color: '#ffffff', 
              border: 'none', 
              borderRadius: '4px', 
              fontWeight: '600', 
              fontSize: '13px',
              transition: 'background-color 0.3s ease, color 0.3s ease' 
            }}
          >
            {theme === 'light' ? '🌙 Switch to Dark' : '☀️ Switch to Light'}
          </button>
        </div>

        {/* Database Status */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0', borderBottom: '1px solid var(--border-color)', transition: 'border-color 0.3s ease' }}>
          <div>
            <strong style={{ display: 'block', fontSize: '15px' }}>
              Database Synchronizer
            </strong>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)', transition: 'color 0.3s ease' }}>
              Automatic fetch requests querying the MongoDB database layer.
            </span>
          </div>
          <span style={{ color: '#28a745', fontWeight: 'bold', fontSize: '14px' }}>
            🟢 Active (60s)
          </span>
        </div>

      </div>
    </div>
  );
};

export default SettingsPage;
