// src/pages/NotFound.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NotFound = () => {
    const navigate = useNavigate();
    const { token } = useAuth();

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '80vh',
            textAlign: 'center',
            fontFamily: 'sans-serif',
            color: 'var(--text-primary)'
        }}>
            <h1 style={{ fontSize: '72px', margin: '0 0 10px 0', color: '#dc3545' }}>404</h1>
            <h2 style={{ margin: '0 0 20px 0' }}>Oops! Page Not Found</h2>
            <p style={{ color: 'var(--text-muted)', maxWidth: '400px', margin: '0 0 30px 0', lineHeight: '1.5' }}>
                The URL path you are trying to access does not exist or may have been relocated.
            </p>
            <button 
                onClick={() => navigate(token ? "/dashboard" : "/login")}
                style={{
                    backgroundColor: '#0070f3',
                    color: '#ffffff',
                    border: 'none',
                    padding: '12px 24px',
                    borderRadius: '4px',
                    fontSize: '15px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'background 0.2s'
                }}
            >
                {token ? "↩️ Return to Dashboard" : "🔒 Return to Login"}
            </button>
        </div>
    );
};

export default NotFound;
