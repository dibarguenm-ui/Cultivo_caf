import React, { useState } from 'react';
import styles from './LoginRegisterForm.module.css';
import axios from 'axios';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      const res = await axios.post('http://127.0.0.1:8000/api/auth/password-reset/', { email });
      if (res.status === 200) {
        setMessage('Si el correo está registrado, se ha enviado un enlace para restablecer la contraseña.');
      } else {
        setMessage('Error al enviar el correo.');
      }
    } catch (err) {
      if (err.response) {
        if (err.response.status === 404) {
          setMessage('El correo no está registrado.');
        } else if (err.response.data && err.response.data.detail) {
          setMessage(err.response.data.detail);
        } else {
          setMessage('Error al enviar el correo.');
        }
      } else {
        setMessage('Error de conexión o servidor.');
      }
    }
    setLoading(false);
  };

  return (
    <div className={styles.container}>
      <div className={styles.formBox}>
        <div className={styles.title}>Recuperar contraseña</div>
        <form onSubmit={handleSubmit}>
          <label className={styles.label}>Correo electrónico</label>
          <input
            className={styles.input}
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="Ingresa tu correo"
            required
          />
          <button className={styles.button} type="submit" disabled={loading}>
            Enviar enlace
          </button>
          {message && <div style={{ marginTop: '1rem', textAlign: 'center', color: '#c0392b', fontWeight: 'bold' }}>{message}</div>}
        </form>
      </div>
    </div>
  );
}
