import React, { useState, useRef } from 'react';
import { registerUser } from './api';
import VerifyAccount from './VerifyAccount';
import styles from './LoginRegisterForm.module.css';

export default function Register() {
  const [form, setForm] = useState({ username: '', email: '', password: '', first_name: '', last_name: '', phone: '' });
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');
  const [showVerify, setShowVerify] = useState(false);
  const [loading, setLoading] = useState(false);
  const inputRefs = useRef({});

  const fields = ['username', 'email', 'password', 'first_name', 'last_name', 'phone'];

  const normalizeErrors = (apiErrors) => {
    const fieldErrors = {};
    if (!apiErrors || typeof apiErrors !== 'object') return fieldErrors;
    // 1) Errores directos por campo
    fields.forEach((f) => {
      if (apiErrors[f]) {
        fieldErrors[f] = Array.isArray(apiErrors[f]) ? apiErrors[f][0] : String(apiErrors[f]);
      }
    });
    // 2) Contenedor 'errors'
    if (apiErrors.errors && typeof apiErrors.errors === 'object') {
      fields.forEach((f) => {
        const v = apiErrors.errors[f];
        if (v) fieldErrors[f] = Array.isArray(v) ? v[0] : String(v);
      });
    }
    // 3) Claves comunes globales
    const globalMsg = apiErrors.detail || apiErrors.non_field_errors || apiErrors.message || apiErrors.error;
    const globalText = Array.isArray(globalMsg) ? globalMsg[0] : globalMsg;
    if (!Object.keys(fieldErrors).length && globalText) {
      // si solo hay error global, marcamos todos los campos
      fields.forEach((f) => (fieldErrors[f] = String(globalText)));
    }
    return fieldErrors;
  };

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: undefined });
  };

  const validateField = (name, value) => {
    if (name === 'username') {
      if (!value) return 'El usuario es obligatorio';
      if (value.length < 3) return 'Mínimo 3 caracteres';
      if (/\s/.test(value)) return 'Sin espacios';
    }
    if (name === 'email') {
      if (!value) return 'El email es obligatorio';
      const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRe.test(value)) return 'Email inválido';
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
    const err = validateField(name, value);
    setErrors((prev) => ({ ...prev, [name]: err }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    // Validación en cliente antes de llamar a la API
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
      setMessage('Usuario registrado correctamente. Revisa tu correo para verificar la cuenta.');
      setShowVerify(true);
    } catch (err) {
      const apiErrors = err.response?.data || {};
      const fieldErrors = normalizeErrors(apiErrors);
      if (Object.keys(fieldErrors).length) {
        setMessage('Corrige los campos marcados en rojo.');
        // Enfocar el primer campo con error
        const firstWithError = fields.find((f) => fieldErrors[f]);
        if (firstWithError && inputRefs.current[firstWithError]) {
          inputRefs.current[firstWithError].focus();
        }
      } else {
        setMessage('Error: Datos inválidos');
      }
      setErrors(fieldErrors);
    }
    finally {
      setLoading(false);
    }
  };

  if (showVerify) {
    return <VerifyAccount email={form.email} onVerified={() => setMessage('Cuenta verificada correctamente')} />;
  }

  return (
    <div className={styles.container}>
      <div className={styles.formBox}>
        <h1 className={styles.title}>Formulario de registro</h1>
        <form onSubmit={handleSubmit}>
          {/* Usuario */}
          <div>
            <div style={{ position: 'relative' }}>
              <input
                name="username"
                placeholder="Usuario"
                onChange={handleChange}
                onBlur={handleBlur}
                required
                className={errors.username ? styles.inputError : styles.input}
                aria-invalid={!!errors.username}
                ref={(el) => (inputRefs.current.username = el)}
                value={form.username}
              />
              {errors.username && <span style={{ position: 'absolute', right: '15px', top: '50%', transform: 'translateY(-50%)', color: '#e74c3c', fontSize: '1.2rem', pointerEvents: 'none' }}>❌</span>}
            </div>
            {errors.username && <div className={styles.errorMsg}>{errors.username}</div>}
          </div>

          {/* Email */}
          <div>
            <div style={{ position: 'relative' }}>
              <input
                name="email"
                type="email"
                placeholder="Email"
                onChange={handleChange}
                onBlur={handleBlur}
                required
                className={errors.email ? styles.inputError : styles.input}
                aria-invalid={!!errors.email}
                ref={(el) => (inputRefs.current.email = el)}
                value={form.email}
              />
              {errors.email && <span style={{ position: 'absolute', right: '15px', top: '50%', transform: 'translateY(-50%)', color: '#e74c3c', fontSize: '1.2rem', pointerEvents: 'none' }}>❌</span>}
            </div>
            {errors.email && <div className={styles.errorMsg}>{errors.email}</div>}
          </div>

          {/* Contraseña */}
          <div>
            <div style={{ position: 'relative' }}>
              <input
                name="password"
                type="password"
                placeholder="Contraseña"
                onChange={handleChange}
                onBlur={handleBlur}
                required
                className={errors.password ? styles.inputError : styles.input}
                aria-invalid={!!errors.password}
                ref={(el) => (inputRefs.current.password = el)}
                value={form.password}
              />
              {errors.password && <span style={{ position: 'absolute', right: '15px', top: '50%', transform: 'translateY(-50%)', color: '#e74c3c', fontSize: '1.2rem', pointerEvents: 'none' }}>❌</span>}
            </div>
            {errors.password && <div className={styles.errorMsg}>{errors.password}</div>}
          </div>

          {/* Nombre */}
          <div>
            <div style={{ position: 'relative' }}>
              <input
                name="first_name"
                placeholder="Nombre"
                onChange={handleChange}
                onBlur={handleBlur}
                className={errors.first_name ? styles.inputError : styles.input}
                aria-invalid={!!errors.first_name}
                ref={(el) => (inputRefs.current.first_name = el)}
                value={form.first_name}
              />
              {errors.first_name && <span style={{ position: 'absolute', right: '15px', top: '50%', transform: 'translateY(-50%)', color: '#e74c3c', fontSize: '1.2rem', pointerEvents: 'none' }}>❌</span>}
            </div>
            {errors.first_name && <div className={styles.errorMsg}>{errors.first_name}</div>}
          </div>

          {/* Apellido */}
          <div>
            <div style={{ position: 'relative' }}>
              <input
                name="last_name"
                placeholder="Apellido"
                onChange={handleChange}
                onBlur={handleBlur}
                className={errors.last_name ? styles.inputError : styles.input}
                aria-invalid={!!errors.last_name}
                ref={(el) => (inputRefs.current.last_name = el)}
                value={form.last_name}
              />
              {errors.last_name && <span style={{ position: 'absolute', right: '15px', top: '50%', transform: 'translateY(-50%)', color: '#e74c3c', fontSize: '1.2rem', pointerEvents: 'none' }}>❌</span>}
            </div>
            {errors.last_name && <div className={styles.errorMsg}>{errors.last_name}</div>}
          </div>

          {/* Teléfono */}
          <div>
            <div style={{ position: 'relative' }}>
              <input
                name="phone"
                placeholder="Teléfono"
                onChange={handleChange}
                onBlur={handleBlur}
                className={errors.phone ? styles.inputError : styles.input}
                aria-invalid={!!errors.phone}
                ref={(el) => (inputRefs.current.phone = el)}
                value={form.phone}
              />
              {errors.phone && <span style={{ position: 'absolute', right: '15px', top: '50%', transform: 'translateY(-50%)', color: '#e74c3c', fontSize: '1.2rem', pointerEvents: 'none' }}>❌</span>}
            </div>
            {errors.phone && <div className={styles.errorMsg}>{errors.phone}</div>}
          </div>

          <button type="submit" className={styles.button} disabled={loading}>
            {loading ? 'Registrando…' : 'REGISTRAR'}
          </button>
          {message && <div style={{ color: '#e74c3c', textAlign: 'center', marginTop: '1rem', fontWeight: 'bold' }}>{message}</div>}
        </form>
      </div>
    </div>
  );
}
