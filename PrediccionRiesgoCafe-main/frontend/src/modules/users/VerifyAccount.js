import React, { useState } from 'react';
import axios from 'axios';
import styles from './LoginRegisterForm.module.css';

export default function VerifyAccount({ email, onVerified }) {
  const [code, setCode] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    try {
  const res = await axios.post('http://127.0.0.1:8000/api/auth/verify/', { email, code });
      setMessage(res.data.detail);
      if (onVerified) onVerified();
    } catch (err) {
      setMessage(err.response?.data?.detail || 'Error al verificar');
    }
    setLoading(false);
  };

  return (
    <div className={styles.formBox}>
      <div className={styles.title}>Verifica tu cuenta</div>
      <form onSubmit={handleSubmit}>
        <label className={styles.label}>Código de verificación</label>
        <input
          className={styles.input}
          type="text"
          value={code}
          onChange={e => setCode(e.target.value)}
          placeholder="Ingresa el código recibido"
          required
        />
        <button className={styles.button} type="submit" disabled={loading}>
          Verificar
        </button>
        <div>{message}</div>
      </form>
    </div>
  );
}
