import React, { useState } from 'react';
import { registerUser } from './api';
import VerifyAccount from './VerifyAccount';

export default function Register() {
  const [form, setForm] = useState({ username: '', email: '', password: '', first_name: '', last_name: '', phone: '' });
  const [message, setMessage] = useState('');
  const [showVerify, setShowVerify] = useState(false);

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      await registerUser(form);
      setMessage('Usuario registrado correctamente. Revisa tu correo para verificar la cuenta.');
      setShowVerify(true);
    } catch (err) {
      setMessage('Error: ' + (err.response?.data?.email || err.response?.data?.detail || 'Datos inválidos'));
    }
  };

  if (showVerify) {
    return <VerifyAccount email={form.email} onVerified={() => setMessage('Cuenta verificada correctamente')} />;
  }

  return (
    <form onSubmit={handleSubmit}>
      <input name="username" placeholder="Usuario" onChange={handleChange} required />
      <input name="email" type="email" placeholder="Email" onChange={handleChange} required />
      <input name="password" type="password" placeholder="Contraseña" onChange={handleChange} required />
      <input name="first_name" placeholder="Nombre" onChange={handleChange} />
      <input name="last_name" placeholder="Apellido" onChange={handleChange} />
      <input name="phone" placeholder="Teléfono" onChange={handleChange} />
      <button type="submit">Registrar</button>
      <div>{message}</div>
    </form>
  );
}
