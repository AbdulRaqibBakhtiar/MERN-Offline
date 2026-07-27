// src/context/AuthContext.js
import { createContext, useContext, useState } from "react"; 
import api from "../api/axios"; 
import { useNavigate } from 'react-router-dom'; 

const AuthContext = createContext(); 

export const AuthProvider = ({ children }) => { 
  const navigate = useNavigate(); 
  const [token, setToken] = useState(localStorage.getItem("token")); 
  const [user, setUser] = useState(JSON.parse(localStorage.getItem("user"))); 
  const [authError, setAuthError] = useState(""); 

  const login = async (username, password) => { 
    try { 
      setAuthError(""); 
      const res = await api.post("/auth/login", { username, password }); 
      localStorage.setItem("token", res.data.token); 
      localStorage.setItem("user", JSON.stringify(res.data.user)); 
      setToken(res.data.token); 
      setUser(res.data.user); 
      navigate('/home'); 
      return res.data; 
    } catch (err) { 
      setAuthError(err.response?.data?.error || err.response?.data?.message || "Invalid credentials."); 
      throw err; 
    } 
  }; 

  const register = async (username, email, password, firstName, lastName, phoneNumber) => { 
    try { 
      setAuthError(""); 
      const payload = { username, email, password, firstName, lastName, phoneNumber }; 
      return await api.post("/auth/register", payload); 
    } catch (err) { 
      console.error("❌ AuthContext Network Failure Response:", err.response?.data); 
      setAuthError(err.response?.data?.error || err.response?.data?.message || "Registration failed."); 
      throw err; 
    } 
  }; 

  const logout = () => { 
    localStorage.removeItem("token"); 
    localStorage.removeItem("user"); 
    setToken(null); 
    setUser(null); 
    setAuthError(""); 
    navigate('/login'); 
  }; 

  // 🚀 FIXED: Global profile sync method for text, nested shipping objects, and avatars
  const updateProfileState = (updatedUser) => {
    localStorage.setItem("user", JSON.stringify(updatedUser)); // Match your key 'user'
    setUser(updatedUser); // Force-notifies navbar, home container, and layouts globally
  };

  return ( 
    <AuthContext.Provider value={{ 
      token, 
      user, 
      login, 
      register, 
      logout, 
      authError, 
      setAuthError, 
      setToken, 
      setUser,
      updateProfileState // 🚀 Exposed for profile pages
    }}> 
      {children} 
    </AuthContext.Provider> 
  ); 
}; 

export const useAuth = () => { 
  return useContext(AuthContext); 
};
