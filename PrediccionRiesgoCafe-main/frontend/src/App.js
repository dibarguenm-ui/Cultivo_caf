import React, { useContext } from 'react';
import LoginRegisterForm from './modules/users/LoginRegisterForm';
import { AuthProvider, AuthContext } from './modules/users/AuthContext';
import MainMenu from './modules/users/MainMenu';
import AccountActivated from './modules/users/AccountActivated';
import ForgotPassword from './modules/users/ForgotPassword';
import ResetPassword from './modules/users/ResetPassword';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';


function AppContent() {
  const { accessToken, login } = useContext(AuthContext);
  const isAuthenticated = !!accessToken;

  return (
    <Routes>
      <Route path="/activate" element={<AccountActivated />} />
  <Route path="/forgot-password" element={<ForgotPassword />} />
  <Route path="/reset-password/:token" element={<ResetPassword />} />
      <Route path="/*" element={isAuthenticated ? <MainMenu /> : <LoginRegisterForm onLogin={login} />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;