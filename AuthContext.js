// AuthContext.js
import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userToken, setUserToken] = useState(null);

  useEffect(() => {
    // Load user info from AsyncStorage when app starts
    const loadUserData = async () => {
      const data = await AsyncStorage.getItem('userData');
      if (data) {
        const parsed = JSON.parse(data);
        setUser(parsed);
        setUserToken('token'); // You can adjust this if your backend returns tokens later
      }
    };
    loadUserData();
  }, []);

  const login = async (userData, token = null) => {
    setUser(userData);
    setUserToken(token);
    await AsyncStorage.setItem('userData', JSON.stringify(userData));
  };

  const logout = async () => {
    setUser(null);
    setUserToken(null);
    await AsyncStorage.removeItem('userData');
  };

  return (
    <AuthContext.Provider value={{ user, userToken, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
