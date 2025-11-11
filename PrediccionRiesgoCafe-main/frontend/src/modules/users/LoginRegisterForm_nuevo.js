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
  const [messageType, setMessageType] = useState(''); // 'success' o 'error'
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = e => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === 'checkbox' ? checked : value });
    // Limpiar error del campo
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
    if (message) setMessage('');
  };

  const validateEmail = email => /.+@.+\..+/.test(email);

  const validateForm = () => {
    const newErrors = {};

    if (!form.username) {
      newErrors.username = 'El usuario es obligatorio';
    } else if (form.username.length < 3) {
      newErrors.username = 'Mínimo 3 caracteres';
    }

    if (!form.password) {
      newErrors.password = 'La contraseña es obligatoria';
    } else if (form.password.length < 8) {
      newErrors.password = 'Mínimo 8 caracteres';
    }

    if (!isLogin) {
      if (!form.email) {
        newErrors.email = 'El email es obligatorio';
      } else if (!validateEmail(form.email)) {
        newErrors.email = 'Email inválido';
      }

      if (!form.first_name) {
        newErrors.first_name = 'El nombre es obligatorio';
      }

      if (!form.last_name) {
        newErrors.last_name = 'El apellido es obligatorio';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async e => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    setMessage('');

    try {
      const res = await loginUser({
        username: form.username,
        password: form.password
      });

      if (res.data.access && res.data.refresh) {
        onLogin(res.data.access, res.data.refresh);
        setMessage('¡Inicio de sesión exitoso!');
        setMessageType('success');
      } else {
        setMessage('Error inesperado: no se recibió token');
        setMessageType('error');
      }
    } catch (err) {
      if (err.response && err.response.status === 401) {
        const detail = err.response.data?.detail || '';
        if (detail.includes('La cuenta debe ser activada')) {
          setMessage('⚠️ La cuenta debe ser activada. Revisa tu correo y haz clic en el enlace de activación.');
        } else {
          setMessage('❌ Credenciales incorrectas. Por favor verifica tu usuario y contraseña.');
        }
      } else {
        setMessage('❌ Error de conexión. Por favor intenta nuevamente.');
      }
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async e => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    setMessage('');

    try {
      await registerUser(form);
      setMessage('✓ ¡Usuario registrado correctamente! Revisa tu email para activar tu cuenta.');
      setMessageType('success');

      // Cambiar a modo login después de 2 segundos
      setTimeout(() => {
        setIsLogin(true);
        setMessage('');
      }, 3000);
    } catch (err) {
      const apiErrors = err.response?.data || {};

      // Procesar errores del backend
      const newErrors = {};
      Object.keys(apiErrors).forEach(key => {
        if (Array.isArray(apiErrors[key])) {
          newErrors[key] = apiErrors[key][0];
        } else {
          newErrors[key] = apiErrors[key];
        }
      });

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        setMessage('❌ Por favor corrige los errores en el formulario.');
      } else {
        setMessage('❌ Error al registrar usuario. Intenta nuevamente.');
      }
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      {/* Logo superior */}
      <div className={styles.logo}>
        <span className={styles.logoIcon}>☕</span>
        <div className={styles.logoText}>
          <span className={styles.logoTitle}>CoffeeWatch</span>
          <span className={styles.logoSubtitle}>Sistema Inteligente</span>
        </div>
      </div>

      {/* Elementos decorativos de café */}
      <div className={styles.coffeeDecor}>
        <span className={styles.coffeeBean1}>🫘</span>
        <span className={styles.coffeeBean2}>☕</span>
        <span className={styles.coffeePlant}>🌱</span>
      </div>

      {/* Formulario */}
      <div className={styles.formBox}>
        <h1 className={styles.title}>
          {isLogin ? 'Iniciar Sesión' : 'Crear Cuenta'}
        </h1>

        {/* Mensaje de estado */}
        {message && (
          <div className={messageType === 'success' ? styles.messageSuccess : styles.messageError}>
            {message}
          </div>
        )}

        <form onSubmit={isLogin ? handleLogin : handleRegister}>
          {/* Campo de Usuario */}
          <div className={styles.inputWrapper}>
            <span className={styles.inputIcon}>👤</span>
            <input
              className={errors.username ? `${styles.input} ${styles.inputError}` : styles.input}
              name="username"
              type="text"
              placeholder="Usuario"
              value={form.username}
              onChange={handleChange}
              autoComplete="username"
            />
            {errors.username && (
              <div className={styles.errorMessage}>
                <span>⚠️</span> {errors.username}
              </div>
            )}
          </div>

          {/* Campo de Email (solo en registro) */}
          {!isLogin && (
            <div className={styles.inputWrapper}>
              <span className={styles.inputIcon}>📧</span>
              <input
                className={errors.email ? `${styles.input} ${styles.inputError}` : styles.input}
                name="email"
                type="email"
                placeholder="Email"
                value={form.email}
                onChange={handleChange}
                autoComplete="email"
              />
              {errors.email && (
                <div className={styles.errorMessage}>
                  <span>⚠️</span> {errors.email}
                </div>
              )}
            </div>
          )}

          {/* Campo de Contraseña */}
          <div className={styles.inputWrapper}>
            <span className={styles.inputIcon}>🔒</span>
            <input
              className={errors.password ? `${styles.input} ${styles.inputError}` : styles.input}
              name="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Contraseña"
              value={form.password}
              onChange={handleChange}
              autoComplete={isLogin ? 'current-password' : 'new-password'}
            />
            <button
              type="button"
              className={styles.passwordToggle}
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            >
              {showPassword ? '👁️' : '👁️‍🗨️'}
            </button>
            {errors.password && (
              <div className={styles.errorMessage}>
                <span>⚠️</span> {errors.password}
              </div>
            )}
          </div>

          {/* Campos adicionales en registro */}
          {!isLogin && (
            <>
              <div className={styles.inputWrapper}>
                <span className={styles.inputIcon}>✏️</span>
                <input
                  className={errors.first_name ? `${styles.input} ${styles.inputError}` : styles.input}
                  name="first_name"
                  type="text"
                  placeholder="Nombre"
                  value={form.first_name}
                  onChange={handleChange}
                  autoComplete="given-name"
                />
                {errors.first_name && (
                  <div className={styles.errorMessage}>
                    <span>⚠️</span> {errors.first_name}
                  </div>
                )}
              </div>

              <div className={styles.inputWrapper}>
                <span className={styles.inputIcon}>✏️</span>
                <input
                  className={errors.last_name ? `${styles.input} ${styles.inputError}` : styles.input}
                  name="last_name"
                  type="text"
                  placeholder="Apellido"
                  value={form.last_name}
                  onChange={handleChange}
                  autoComplete="family-name"
                />
                {errors.last_name && (
                  <div className={styles.errorMessage}>
                    <span>⚠️</span> {errors.last_name}
                  </div>
                )}
              </div>

              <div className={styles.inputWrapper}>
                <span className={styles.inputIcon}>📱</span>
                <input
                  className={styles.input}
                  name="phone"
                  type="tel"
                  placeholder="Teléfono (opcional)"
                  value={form.phone}
                  onChange={handleChange}
                  autoComplete="tel"
                />
              </div>
            </>
          )}

          {/* Checkbox Recordarme (solo en login) */}
          {isLogin && (
            <label className={styles.remember}>
              <input
                type="checkbox"
                name="remember"
                checked={form.remember}
                onChange={handleChange}
              />
              <span>Recordarme</span>
            </label>
          )}

          {/* Botón principal */}
          <button
            type="submit"
            className={styles.button}
            disabled={loading}
          >
            {loading ? (
              '⏳ Procesando...'
            ) : (
              isLogin ? 'ACCEDER' : 'REGISTRARSE'
            )}
          </button>

          {/* Enlaces de ayuda (solo en login) */}
          {isLogin && (
            <div className={styles.options}>
              <span
                className={styles.link}
                onClick={() => navigate('/forgot-password')}
              >
                ¿Olvidaste tu contraseña?
              </span>
            </div>
          )}

          {/* Toggle entre Login/Registro */}
          <div className={styles.signup}>
            {isLogin ? (
              <>
                ¿Nuevo en CoffeeWatch?
                <span
                  className={styles.signupLink}
                  onClick={() => {
                    setIsLogin(false);
                    setMessage('');
                    setErrors({});
                  }}
                >
                  Regístrate ahora
                </span>
              </>
            ) : (
              <>
                ¿Ya tienes cuenta?
                <span
                  className={styles.signupLink}
                  onClick={() => {
                    setIsLogin(true);
                    setMessage('');
                    setErrors({});
                  }}
                >
                  Inicia sesión
                </span>
              </>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

