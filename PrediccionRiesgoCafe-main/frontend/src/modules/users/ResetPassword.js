import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styles from './LoginRegisterForm.module.css';
import axios from 'axios';

export default function ResetPassword() {
  const { token } = useParams();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async e => {
    e.preventDefault();
    if (password !== confirm) {
      setMessage('Las contraseñas no coinciden');
      return;
    }
    setLoading(true);
    setMessage('');
    try {
      await axios.post('http://127.0.0.1:8000/api/auth/password-reset-confirm/', { token, password });
      setMessage('Contraseña cambiada correctamente. Puedes iniciar sesión.');
      setTimeout(() => navigate('/'), 2000);
    } catch (err) {
      setMessage('Error al cambiar la contraseña. El enlace puede estar vencido.');
    }
    setLoading(false);
  };

  return (
    <div className={styles.container}>
      <div className={styles.formBox}>
        <div className={styles.title}>Cambiar contraseña</div>
        <form onSubmit={handleSubmit}>
          <label className={styles.label}>Nueva contraseña</label>
          <div style={{ position: 'relative' }}>
            <input
              className={styles.input}
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Nueva contraseña"
              required
            />
            <button
              type="button"
              aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              onClick={() => setShowPassword(v => !v)}
              tabIndex={0}
            >
              {showPassword ? (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.06 10.06 0 0 1 12 19c-5 0-9.27-3.11-10.44-7.44a1.94 1.94 0 0 1 0-1.12A10.06 10.06 0 0 1 6.06 6.06"/><path d="M1 1l22 22"/><path d="M9.88 9.88A3 3 0 0 0 12 15a3 3 0 0 0 2.12-5.12"/></svg>
              ) : (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z"/><circle cx="12" cy="12" r="3"/></svg>
              )}
            </button>
          </div>
          <label className={styles.label}>Confirmar contraseña</label>
          <div style={{ position: 'relative' }}>
            <input
              className={styles.input}
              type={showConfirm ? 'text' : 'password'}
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              placeholder="Confirmar contraseña"
              required
            />
            <button
              type="button"
              aria-label={showConfirm ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              onClick={() => setShowConfirm(v => !v)}
              tabIndex={0}
            >
              {showConfirm ? (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.06 10.06 0 0 1 12 19c-5 0-9.27-3.11-10.44-7.44a1.94 1.94 0 0 1 0-1.12A10.06 10.06 0 0 1 6.06 6.06"/><path d="M1 1l22 22"/><path d="M9.88 9.88A3 3 0 0 0 12 15a3 3 0 0 0 2.12-5.12"/></svg>
              ) : (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z"/><circle cx="12" cy="12" r="3"/></svg>
              )}
            </button>
          </div>
          <button className={styles.button} type="submit" disabled={loading}>
            Cambiar contraseña
          </button>
          {message && <div style={{ marginTop: '1rem', textAlign: 'center', color: '#c0392b', fontWeight: 'bold' }}>{message}</div>}
        </form>
      </div>
    </div>
  );
}
