import React, { useState } from 'react';
import LoginPage from './LoginPage';
import { useAuth } from '../context/AuthContext';

const LoginContainer = ({ initialRegisterMode = false }) => {
    const [isLoginMode, setIsLoginMode] = useState(!initialRegisterMode);
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [email, setEmail] = useState("");
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [phoneNumber, setPhoneNumber] = useState("");

    const [authError, setAuthError] = useState("");
    const { login, register } = useAuth();
    const [successModal, setSuccessModal] = useState({ isOpen: false, message: "" });
    const [toast, setToast] = useState({ isOpen: false, message: "", type: "success" });

    const triggerToastNotice = (message, type = "success") => {
        setToast({ isOpen: true, message, type });
        setTimeout(() => setToast(prev => ({ ...prev, isOpen: false })), 4000);
    };

    const clearFormFields = () => {
        setUsername(""); setPassword(""); setConfirmPassword("");
        setEmail(""); setFirstName(""); setLastName(""); setPhoneNumber("");
        setAuthError("");
    };

  const handleAuthSubmit = async (e) => {
  e.preventDefault();
  setAuthError("");

  if (isLoginMode) {
    if (!username || !password) {
      return triggerToastNotice("Please fill out all fields!", "error");
    }
  } else {
    if (!username || !email || !password || !confirmPassword) {
      return triggerToastNotice("Please fill out all registration fields!", "error");
    }
    
    // 🔒 STRICT PASSWORD BOX IDENTITY CHECK
    if (password !== confirmPassword) {
      return triggerToastNotice("Passwords do not match. Please verify your entry.", "error");
    }
    
    // 🔒 SECURITY COMPLEXITY VALIDATION RULES
    if (password.length < 8) {
      return triggerToastNotice("Password must be at least 8 characters long.", "error");
    }
    if (!/[A-Z]/.test(password)) {
      return triggerToastNotice("Password must contain at least one capital letter (A-Z).", "error");
    }
    if (!/[0-9]/.test(password)) {
      return triggerToastNotice("Password must contain at least one numeric digit (0-9).", "error");
    }
    if (!/[!@#$%^&*(),.?":{}|<>_]/.test(password)) {
      return triggerToastNotice("Password must contain at least one special character (e.g., !, @, #, $, %).", "error");
    }
  }

  try {
    if (isLoginMode) {
      await login(username, password);
      clearFormFields();
    } else {
      await register(username, email, password, firstName, lastName, phoneNumber);
      
      setSuccessModal({ isOpen: true, message: "Account created successfully! Welcome to Bazzar." });
      clearFormFields();
    }
  } catch (err) {
    console.error("Auth submission error details:", err);
    
    // Extract the actual string value from your backend payload layers safely
    const backendError = 
      err.response?.data?.error || 
      err.response?.data?.message || 
      err.response?.data || 
      err.message || 
      "An authentication error occurred.";
      
    const errorString = typeof backendError === 'string' ? backendError : JSON.stringify(backendError);
    
    setAuthError(errorString);
    triggerToastNotice(errorString, "error");
  }
};



    return (
        <div className="auth-master-universe">

            {/* 🚀 NEW: Big Beautiful Typographic Branding Text Layer */}
            <div className="premium-bg-watermark">
                Bazzar
            </div>

            {/* SVG Background Element 1: Rotating Engine Gear Wheel (Bottom Left) */}
            <svg
                style={{ position: 'absolute', bottom: '-40px', left: '-40px', width: '280px', height: '280px', color: 'rgba(148, 163, 184, 0.08)', zIndex: 1, pointerEvents: 'none', animation: 'engineGearSpin 35s linear infinite' }}
                viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
            >
                <circle cx="12" cy="12" r="3"></circle>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
            </svg>

            {/* SVG Background Element 2: Floating Mechanic Spanner (Top Right) */}
            <svg
                style={{ position: 'absolute', top: '10%', right: '8%', width: '140px', height: '140px', color: 'rgba(148, 163, 184, 0.06)', zIndex: 1, pointerEvents: 'none', animation: 'toolFloatBreathing 6s ease-in-out infinite' }}
                viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"
            >
                <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>
            </svg>

            <LoginPage
                isLoginMode={isLoginMode}
                setIsLoginMode={(val) => { setIsLoginMode(val); clearFormFields(); }}
                username={username} setUsername={setUsername}
                password={password} setPassword={setPassword}
                confirmPassword={confirmPassword} setConfirmPassword={setConfirmPassword}
                email={email} setEmail={setEmail}
                firstName={firstName} setFirstName={setFirstName}
                lastName={lastName} setLastName={setLastName}
                phoneNumber={phoneNumber} setPhoneNumber={setPhoneNumber}
                authError={authError} setAuthError={setAuthError}
                handleAuthSubmit={handleAuthSubmit}
                successModal={successModal} handleCloseSuccessModal={() => { setSuccessModal({ isOpen: false, message: "" }); setIsLoginMode(true); triggerToastNotice("Login system live!", "success"); }}
                toast={toast} closeToast={() => setToast(p => ({ ...p, isOpen: false }))}
            />

        </div>
    );
};

export default LoginContainer;
