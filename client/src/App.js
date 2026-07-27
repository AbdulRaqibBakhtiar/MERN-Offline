// src/App.js
import React, { useState, useEffect } from "react";
import './App.css';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import LoginContainer from './pages/LoginContainer';
import HomeContainer from './pages/HomeContainer';
import RegisterPage from './pages/RegisterPage';
import ProductPurchasePage from './pages/ProductPurchasePage';
import SettingsPage from './pages/SettingsPage';
import NotFound from './pages/NotFound';

const ProtectedRoute = () => {
  const { token } = useAuth();
  return token ? <Outlet /> : <Navigate to="/login" replace />;
};

function App() {
  const { token } = useAuth();
  
  // Manage and persist your theme selection state
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("app-theme") || "light";
  });

  useEffect(() => {
    document.body.setAttribute("data-theme", theme);
    localStorage.setItem("app-theme", theme);
  }, [theme]);

  return (
    <Routes>
      <Route path="/login" element={token ? <Navigate to="/home" replace /> : <LoginContainer />} />
      <Route path="/register" element={token ? <Navigate to="/home" replace /> : <RegisterPage />} />
      
      <Route element={<ProtectedRoute />}>
        <Route element={ <SocketProvider> <Outlet /> </SocketProvider> } >
          
          {/* FIXED: Passing the theme states into HomeContainer */}
          <Route path="/home" element={<HomeContainer theme={theme} setTheme={setTheme} />} />
          
          <Route path="/purchase/:itemId" element={<ProductPurchasePage />} />
          <Route path="/settings" element={<SettingsPage theme={theme} setTheme={setTheme} />} />
          <Route path="/" element={<Navigate to="/home" replace />} />
        </Route>
      </Route>
      
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;
