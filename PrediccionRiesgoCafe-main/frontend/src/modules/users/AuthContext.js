import React, { createContext, useState } from 'react';

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [accessToken, setAccessToken] = useState(
    localStorage.getItem('accessToken') || 
    localStorage.getItem('access_token') || 
    ''
  );
  const [refreshToken, setRefreshToken] = useState(
    localStorage.getItem('refreshToken') || 
    localStorage.getItem('refresh_token') || 
    ''
  );

  const login = (access, refresh) => {
    setAccessToken(access);
    setRefreshToken(refresh);
    // Guardar con ambas convenciones para compatibilidad
    localStorage.setItem('accessToken', access);
    localStorage.setItem('access_token', access);
    localStorage.setItem('refreshToken', refresh);
    localStorage.setItem('refresh_token', refresh);
  };

  const logout = () => {
    setAccessToken('');
    setRefreshToken('');
    // Limpiar ambas convenciones
    localStorage.removeItem('accessToken');
    localStorage.removeItem('access_token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('refresh_token');
  };

  return (
    <AuthContext.Provider value={{ accessToken, refreshToken, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
