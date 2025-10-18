import React, { useState, useRef } from 'react';
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
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const inputRefs = useRef({});

  const fields = ['username', 'email', 'password', 'first_name', 'last_name', 'phone'];

  // Validación de email básica
  const validateEmail = email => /.+@.+\..+/.test(email);

  const validateField = (name, value) => {
    if (name === 'username') {
      if (!value) return 'El usuario es obligatorio';
      if (value.length < 3) return 'Mínimo 3 caracteres';
      if (/\s/.test(value)) return 'Sin espacios';
    }
    if (name === 'email') {
      if (!value) return 'El email es obligatorio';
      if (!validateEmail(value)) return 'Email inválido';
    }
    if (name === 'password') {
      if (!value) return 'La contraseña es obligatoria';
      if (value.length < 8) return 'Mínimo 8 caracteres';
      if (!/[A-Za-z]/.test(value) || !/[0-9]/.test(value)) return 'Debe incluir letras y números';
    }
    if (name === 'first_name' && value) {
      if (!/^[A-Za-zÁÉÍÓÚáéíóúñÑ\s'-]{2,}$/.test(value)) return 'Nombre inválido';
    }
    if (name === 'last_name' && value) {
      if (!/^[A-Za-zÁÉÍÓÚáéíóúñÑ\s'-]{2,}$/.test(value)) return 'Apellido inválido';
    }
    if (name === 'phone' && value) {
      const digits = value.replace(/\D/g, '');
      if (digits.length < 7 || digits.length > 15) return 'Teléfono inválido';
    }
    return undefined;
  };

  const validateAll = (data) => {
    const errs = {};
    fields.forEach((f) => {
      const err = validateField(f, data[f]);
      if (err) errs[f] = err;
    });
    return errs;
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    if (!isLogin) {
      const err = validateField(name, value);
      setErrors((prev) => ({ ...prev, [name]: err }));
    }
  };

  const handleChange = e => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === 'checkbox' ? checked : value });
    // Limpiar error del campo cuando el usuario lo modifica
    if (name !== 'remember' && !isLogin) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
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
    // Validación en cliente
    const clientErrors = validateAll(form);
    if (Object.keys(clientErrors).length) {
      setErrors(clientErrors);
      setMessage('Corrige los campos marcados en rojo.');
      const first = fields.find((f) => clientErrors[f]);
      if (first && inputRefs.current[first]) inputRefs.current[first].focus();
      return;
    }
    setErrors({});
    try {
      setLoading(true);
      await registerUser(form);
      setMessage('Usuario registrado correctamente');
      setIsLogin(true);
    } catch (err) {
      // Manejo de errores del backend
      const apiErrors = err.response?.data || {};
      let fieldErrors = {};
      fields.forEach((f) => {
        if (apiErrors[f]) {
          fieldErrors[f] = Array.isArray(apiErrors[f]) ? apiErrors[f][0] : String(apiErrors[f]);
        }
      });
      if (Object.keys(fieldErrors).length) {
        setMessage('Corrige los campos marcados en rojo.');
        const first = fields.find((f) => fieldErrors[f]);
        if (first && inputRefs.current[first]) inputRefs.current[first].focus();
      } else {
        setMessage('Error: ' + (apiErrors.detail || 'Datos inválidos'));
      }
      setErrors(fieldErrors);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.formBox}>
        <div className={styles.title}>{isLogin ? 'Formulario de inicio de sesión' : 'Formulario de registro'}</div>
        <form onSubmit={isLogin ? handleLogin : handleRegister}>
          {/* Username */}
          <div>
            <div style={{ position: 'relative' }}>
              <input
                className={!isLogin && errors.username ? styles.inputError : styles.input}
                name="username"
                placeholder="Usuario"
                value={form.username}
                onChange={handleChange}
                onBlur={handleBlur}
                required
                ref={(el) => (inputRefs.current.username = el)}
              />
              {!isLogin && errors.username && <span style={{ position: 'absolute', right: '15px', top: '50%', transform: 'translateY(-50%)', color: '#e74c3c', fontSize: '1.2rem', pointerEvents: 'none' }}>❌</span>}
            </div>
            {!isLogin && errors.username && <div className={styles.errorMsg}>{errors.username}</div>}
          </div>

          {/* Password */}
          <div>
            <div style={{ position: 'relative' }}>
              <input
                className={!isLogin && errors.password ? styles.inputError : styles.input}
                name="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Contraseña"
                value={form.password}
                onChange={handleChange}
                onBlur={handleBlur}
                required
                ref={(el) => (inputRefs.current.password = el)}
              />
              <span
                style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', display: 'flex', alignItems: 'center', height: '48px' }}
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
              {!isLogin && errors.password && <span style={{ position: 'absolute', right: '50px', top: '50%', transform: 'translateY(-50%)', color: '#e74c3c', fontSize: '1.2rem', pointerEvents: 'none' }}>❌</span>}
            </div>
            {!isLogin && errors.password && <div className={styles.errorMsg}>{errors.password}</div>}
          </div>

          {!isLogin && (
            <>
              {/* Email */}
              <div>
                <div style={{ position: 'relative' }}>
                  <input
                    className={errors.email ? styles.inputError : styles.input}
                    name="email"
                    type="email"
                    placeholder="Email"
                    value={form.email}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    required
                    ref={(el) => (inputRefs.current.email = el)}
                  />
                  {errors.email && <span style={{ position: 'absolute', right: '15px', top: '50%', transform: 'translateY(-50%)', color: '#e74c3c', fontSize: '1.2rem', pointerEvents: 'none' }}>❌</span>}
                </div>
                {errors.email && <div className={styles.errorMsg}>{errors.email}</div>}
              </div>

              {/* First Name */}
              <div>
                <div style={{ position: 'relative' }}>
                  <input
                    className={errors.first_name ? styles.inputError : styles.input}
                    name="first_name"
                    placeholder="Nombre"
                    value={form.first_name}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    required
                    ref={(el) => (inputRefs.current.first_name = el)}
                  />
                  {errors.first_name && <span style={{ position: 'absolute', right: '15px', top: '50%', transform: 'translateY(-50%)', color: '#e74c3c', fontSize: '1.2rem', pointerEvents: 'none' }}>❌</span>}
                </div>
                {errors.first_name && <div className={styles.errorMsg}>{errors.first_name}</div>}
              </div>

              {/* Last Name */}
              <div>
                <div style={{ position: 'relative' }}>
                  <input
                    className={errors.last_name ? styles.inputError : styles.input}
                    name="last_name"
                    placeholder="Apellido"
                    value={form.last_name}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    required
                    ref={(el) => (inputRefs.current.last_name = el)}
                  />
                  {errors.last_name && <span style={{ position: 'absolute', right: '15px', top: '50%', transform: 'translateY(-50%)', color: '#e74c3c', fontSize: '1.2rem', pointerEvents: 'none' }}>❌</span>}
                </div>
                {errors.last_name && <div className={styles.errorMsg}>{errors.last_name}</div>}
              </div>

              {/* Phone */}
              <div>
                <div style={{ position: 'relative' }}>
                  <input
                    className={errors.phone ? styles.inputError : styles.input}
                    name="phone"
                    placeholder="Teléfono"
                    value={form.phone}
                    onChange={e => {
                      const val = e.target.value.replace(/[^0-9]/g, '');
                      setForm(f => ({ ...f, phone: val }));
                      setErrors((prev) => ({ ...prev, phone: undefined }));
                    }}
                    onBlur={handleBlur}
                    required
                    ref={(el) => (inputRefs.current.phone = el)}
                    inputMode="numeric"
                    pattern="[0-9]*"
                  />
                  {errors.phone && <span style={{ position: 'absolute', right: '15px', top: '50%', transform: 'translateY(-50%)', color: '#e74c3c', fontSize: '1.2rem', pointerEvents: 'none' }}>❌</span>}
                </div>
                {errors.phone && <div className={styles.errorMsg}>{errors.phone}</div>}
              </div>
            </>
          )}
          {isLogin && (
            <div className={styles.remember}>
              <input type="checkbox" name="remember" checked={form.remember} onChange={handleChange} />
              <label htmlFor="remember">Remember me</label>
            </div>
          )}
          <button className={styles.button} type="submit" disabled={loading}>
            {loading ? (isLogin ? 'Accediendo...' : 'Registrando...') : (isLogin ? 'ACCESO' : 'REGISTRAR')}
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
