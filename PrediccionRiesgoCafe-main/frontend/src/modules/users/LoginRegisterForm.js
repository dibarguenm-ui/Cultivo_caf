import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginUser, registerUser } from './api';
import styles from './LoginRegisterForm.module.css';

export default function LoginRegisterForm({ onLogin }) {
  const [isLogin, setIsLogin] = useState(true);
  const navigate = useNavigate();
  const [form, setForm] = useState({
    username: '',
    password: '',
    email: '',
    first_name: '',
    last_name: '',
    phone: '',
    remember: false
  });
  const [message, setMessage] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  // Validación de email básica
  const validateEmail = email => /.+@.+\..+/.test(email);

  const handleChange = e => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === 'checkbox' ? checked : value });
  };

  const handleLogin = async e => {
    e.preventDefault();
    try {
      const res = await loginUser({ username: form.username, password: form.password });
      if (res.data.access && res.data.refresh) {
        onLogin(res.data.access, res.data.refresh);
        setMessage('Login exitoso');
      } else {
        setMessage('Error inesperado: no se recibió token');
      }
    } catch (err) {
      if (err.response && err.response.status === 401) {
        const detail = err.response.data?.detail || '';
        if (detail.includes('La cuenta debe ser activada')) {
          setMessage('La cuenta debe ser activada. Revisa tu correo y haz clic en el enlace de activación.');
        } else {
          setMessage('Credenciales incorrectas');
        }
      } else {
        setMessage('Error de conexión o servidor');
      }
    }
  };

  const handleRegister = async e => {
    e.preventDefault();
    if (!validateEmail(form.email)) {
      setMessage('El correo no es válido. Debe contener "@" y "."');
      return;
    }
    try {
      await registerUser(form);
      setMessage('Usuario registrado correctamente');
      setIsLogin(true);
    } catch (err) {
      setMessage('Error: ' + (err.response?.data?.email || err.response?.data?.detail || 'Datos inválidos'));
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.formBox}>
        <div className={styles.title}>{isLogin ? 'Formulario de inicio de sesión' : 'Formulario de registro'}</div>
        <form onSubmit={isLogin ? handleLogin : handleRegister}>
          <input
            className={styles.input}
            name="username"
            placeholder="Enter your Username"
            value={form.username}
            onChange={handleChange}
            required
            style={{ width: '100%', padding: '0.7rem',marginbottom: '1rem',  borderradius: '25px', border: 'none',  fontsize: '1rem',  background: '#fff',  boxshadow: '0 2px 6px rgba(0,0,0,0.04)' }}
          />
          <div style={{ position: 'relative' }}>
            <input
              className={styles.input}
              name="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter your Password"
              value={form.password}
              onChange={handleChange}
              required
              style={{ width: '100%', padding: '0.7rem',marginbottom: '1rem',  borderradius: '25px', border: 'none',  fontsize: '1rem',  background: '#fff',  boxshadow: '0 2px 6px rgba(0,0,0,0.04)'}}
            />
            <span
              style={{ position: 'absolute', right: 2, top: '40%', transform: 'translateY(-50%)', cursor: 'pointer', display: 'flex', alignItems: 'center', height: '48px' }}
              onClick={() => setShowPassword(v => !v)}
              tabIndex={0}
              aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            >
              {showPassword ? (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.06 10.06 0 0 1 12 19c-5 0-9.27-3.11-10.44-7.44a1.94 1.94 0 0 1 0-1.12A10.06 10.06 0 0 1 6.06 6.06"/><path d="M1 1l22 22"/><path d="M9.88 9.88A3 3 0 0 0 12 15a3 3 0 0 0 2.12-5.12"/></svg>
              ) : (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z"/><circle cx="12" cy="12" r="3"/></svg>
              )}
            </span>
          </div>
          {!isLogin && (
            <>
              <input
                className={styles.input}
                name="email"
                type="email"
                placeholder="Enter your Email"
                value={form.email}
                onChange={handleChange}
                required
              />
              <input
                className={styles.input}
                name="first_name"
                placeholder="Enter your First Name"
                value={form.first_name}
                onChange={handleChange}
                required
              />
              <input
                className={styles.input}
                name="last_name"
                placeholder="Enter your Last Name"
                value={form.last_name}
                onChange={handleChange}
                required
              />
              <input
                className={styles.input}
                name="phone"
                placeholder="Enter your Phone"
                value={form.phone}
                onChange={e => {
                  const val = e.target.value.replace(/[^0-9]/g, '');
                  setForm(f => ({ ...f, phone: val }));
                }}
                required
                inputMode="numeric"
                pattern="[0-9]*"
              />
            </>
          )}
          {isLogin && (
            <div className={styles.remember}>
              <input type="checkbox" name="remember" checked={form.remember} onChange={handleChange} />
              <label htmlFor="remember">Remember me</label>
            </div>
          )}
          <button className={styles.button} type="submit">
            {isLogin ? 'ACCESO' : 'REGISTRAR'}
          </button>
          {message && (
            <div style={{
              marginTop: '1rem',
              color:'#c0392b',
              fontWeight: 'bold',
              textAlign: 'center',
            }}>{message}</div>
          )}
        </form>
        <div className={styles.options}>
          {isLogin ? (
            <>
              <span onClick={() => setIsLogin(false)}>¿No tienes una cuenta?</span>
              <span style={{ opacity: 1, cursor: 'pointer', textDecoration: 'underline' }} onClick={() => navigate('/forgot-password')}>¿Se te olvidó tu contraseña?</span>
            </>
          ) : (
            <span onClick={() => setIsLogin(true)}>¿Ya tienes una cuenta?</span>
          )}
        </div>
      </div>
    </div>
  );
}
