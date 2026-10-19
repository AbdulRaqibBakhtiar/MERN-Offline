// src/context/SocketContext.jsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { API_BASE_URL } from '../api/config';

const SocketContext = createContext(null);

// 📡 Custom hook to pull the active live connection channel stream anywhere
export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const { token, user } = useAuth();

  useEffect(() => {
    if (!token) {
      setSocket(null);
      return;
    }

    console.log("🛰️ Connecting to backend collaborative real-time server cluster...");

    const socketConnection = io(API_BASE_URL, {
      transports: ['websocket'],
      autoConnect: true,
      auth: { token }
    });
    setSocket(socketConnection);

    return () => {
      console.log("🔌 Disconnecting live socket stream channel hook...");
      socketConnection.disconnect();
    };

  }, [token, user]);
  // CONTINUATION OF FILE: src/context/SocketContext.jsx

  return (
    /* 🎯 FIXED: Value is now passed as an object {{ socket }} instead of a raw variable */
    /* This allows 'const { socket } = useSocket()' inside HomeContainer to pull it safely! */
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
};
