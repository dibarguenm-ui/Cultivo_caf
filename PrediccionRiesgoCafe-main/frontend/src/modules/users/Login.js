import React, { useState } from 'react';
import { loginUser, getProfile } from './api';
import VerifyAccount from './VerifyAccount';

export default function Login({ onLogin }) {
  const [form, setForm] = useState({ username: '', password: '' });
  const [message, setMessage] = useState('');
  const [showVerify, setShowVerify] = useState(false);
  const [emailToVerify, setEmailToVerify] = useState('');

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      const res = await loginUser(form);
      // Obtener perfil para verificar si está activo y verificado
      const profileRes = await getProfile(res.data.access);
      if (!profileRes.data.email_verified) {
        setEmailToVerify(profileRes.data.email);
        setShowVerify(true);
        setMessage('Verifica tu cuenta para continuar');
        return;
      }
      onLogin(res.data.access, res.data.refresh);
      setMessage('Login exitoso');
    } catch (err) {
      const detail = err.response?.data?.detail || '';
      if (detail.includes('La cuenta debe ser activada')) {
        setMessage('La cuenta debe ser activada. Revisa tu correo y haz clic en el enlace de activación.');
      } else if (detail.includes('no verificada') || detail.includes('verifica tu cuenta')) {
        setMessage('La cuenta debe ser activada. Revisa tu correo y haz clic en el enlace de activación.');
      } else {
        setMessage('Credenciales incorrectas');
      }
    }
  };

  if (showVerify) {
    return <VerifyAccount email={emailToVerify} onVerified={() => setShowVerify(false)} />;
  }

  return (
    <form onSubmit={handleSubmit}>
      <input name="username" placeholder="Usuario o Email" onChange={handleChange} required />
      <input name="password" type="password" placeholder="Contraseña" onChange={handleChange} required />
      <button type="submit">Login</button>
      <div>{message}</div>
    </form>
  );
}
