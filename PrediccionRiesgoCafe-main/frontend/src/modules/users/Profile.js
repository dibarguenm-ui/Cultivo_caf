import axios from 'axios';
import { getProfile, updateProfile } from './api';
import React, { useEffect, useState, useContext } from 'react';
import { AuthContext } from './AuthContext';
import styles from './LoginRegisterForm.module.css';

export default function Profile() {
  const { accessToken } = useContext(AuthContext);
  const [profile, setProfile] = useState({});
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (accessToken) {
      getProfile(accessToken).then(res => setProfile(res.data));
    }
  }, [accessToken]);

  const handleChange = e => setProfile({ ...profile, [e.target.name]: e.target.value });

  // Validación de teléfono: entre 7 y 15 dígitos, opcionalmente con + y código de país
  const validatePhone = phone => /^\+?\d{7,15}$/.test(phone);

  const handleSubmit = async e => {
    e.preventDefault();
    if (!validatePhone(profile.phone)) {
      setMessage('El teléfono debe tener entre 7 y 15 dígitos y puede empezar con +');
      return;
    }
    try {
      await updateProfile(profile, accessToken);
      setMessage('Perfil actualizado');
    } catch (err) {
      setMessage('Error al actualizar');
    }
  };

  if (!accessToken) return <div>Debes iniciar sesión para ver tu perfil.</div>;

  return (
    <div className={styles.container}>
      <div className={styles.formBox}>
        <div className={styles.title}>Mi Perfil</div>
        <form onSubmit={handleSubmit}>
          <label className={styles.label}>Usuario</label>
          <div className={styles.readonly}>
            {profile.username}
          </div>
          <label className={styles.label}>Email</label>
          <div className={styles.readonly}>
            {profile.email}
          </div>
          <label className={styles.label}>Nombre</label>
          <input className={styles.input} name="first_name" value={profile.first_name || ''} onChange={handleChange} />
          <label className={styles.label}>Apellido</label>
          <input className={styles.input} name="last_name" value={profile.last_name || ''} onChange={handleChange} />
          <label className={styles.label}>Teléfono</label>
          <input className={styles.input} name="phone" value={profile.phone || ''} onChange={handleChange} />
          <button className={styles.button} type="submit">Guardar</button>
          <div>{message}</div>
        </form>
      </div>
    </div>
  );
}
