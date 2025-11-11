import React, { useEffect, useState, useContext } from 'react';
import { AuthContext } from './AuthContext';
import { getProfile, updateProfile } from './api';
import styles from './Profile.module.css';

export default function Profile() {
  const { accessToken } = useContext(AuthContext);
  const [profile, setProfile] = useState({});
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (accessToken) {
      getProfile(accessToken).then(res => setProfile(res.data));
    }
  }, [accessToken]);

  const handleChange = e => setProfile({ ...profile, [e.target.name]: e.target.value });

  // Validación de teléfono: entre 7 y 15 dígitos, opcionalmente con + y código de país
  const validatePhone = phone => {
    if (!phone) return true; // Teléfono opcional
    return /^\+?\d{7,15}$/.test(phone);
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setMessage('');

    if (profile.phone && !validatePhone(profile.phone)) {
      setMessage('El teléfono debe tener entre 7 y 15 dígitos y puede empezar con +');
      setMessageType('error');
      return;
    }

    setIsLoading(true);
    try {
      await updateProfile(profile, accessToken);
      setMessage('✓ Perfil actualizado exitosamente');
      setMessageType('success');
    } catch (err) {
      setMessage('✗ Error al actualizar el perfil');
      setMessageType('error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    // Recargar datos originales
    if (accessToken) {
      getProfile(accessToken).then(res => {
        setProfile(res.data);
        setMessage('');
      });
    }
  };

  if (!accessToken) {
    return (
      <div className={styles.profileContainer}>
        <div className={styles.infoBox}>
          <div className={styles.infoTitle}>
            <span>🔒</span> Acceso Requerido
          </div>
          <div className={styles.infoText}>
            Debes iniciar sesión para ver tu perfil.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.profileContainer}>
      {/* Header */}
      <div className={styles.profileHeader}>
        <h1 className={styles.profileTitle}>Mi Perfil</h1>
        <p className={styles.profileSubtitle}>Administra tu información personal</p>
      </div>

      {/* Card principal */}
      <div className={styles.profileCard}>
        {/* Banner superior */}
        <div className={styles.profileBanner}></div>

        {/* Avatar y nombre */}
        <div className={styles.profileAvatarSection}>
          <div className={styles.profileAvatar}>
            {profile.first_name ? profile.first_name.charAt(0).toUpperCase() : '👤'}
          </div>
          <div className={styles.profileName}>
            {profile.first_name && profile.last_name
              ? `${profile.first_name} ${profile.last_name}`
              : profile.username || 'Usuario'
            }
          </div>
          <div className={styles.profileEmail}>{profile.email}</div>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className={styles.profileForm}>
          {/* Información de cuenta (solo lectura) */}
          <div className={styles.formSection}>
            <div className={styles.sectionTitle}>
              <span>🔐</span> Información de Cuenta
            </div>
            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label className={styles.label}>
                  <span>📧</span> Usuario
                </label>
                <div className={styles.readonly}>
                  {profile.username}
                  <span className={styles.readonlyBadge}>Solo lectura</span>
                </div>
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>
                  <span>✉️</span> Email
                </label>
                <div className={styles.readonly}>
                  {profile.email}
                  <span className={styles.readonlyBadge}>Solo lectura</span>
                </div>
              </div>
            </div>
          </div>

          {/* Información personal (editable) */}
          <div className={styles.formSection}>
            <div className={styles.sectionTitle}>
              <span>👤</span> Información Personal
            </div>
            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label className={styles.label}>
                  <span>✏️</span> Nombre
                </label>
                <input
                  className={styles.input}
                  name="first_name"
                  value={profile.first_name || ''}
                  onChange={handleChange}
                  placeholder="Ej: Juan"
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>
                  <span>✏️</span> Apellido
                </label>
                <input
                  className={styles.input}
                  name="last_name"
                  value={profile.last_name || ''}
                  onChange={handleChange}
                  placeholder="Ej: Pérez"
                />
              </div>
            </div>
          </div>

          {/* Información de contacto */}
          <div className={styles.formSection}>
            <div className={styles.sectionTitle}>
              <span>📱</span> Información de Contacto
            </div>
            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label className={styles.label}>
                  <span>📞</span> Teléfono
                </label>
                <input
                  className={styles.input}
                  name="phone"
                  value={profile.phone || ''}
                  onChange={handleChange}
                  placeholder="Ej: +573001234567"
                  type="tel"
                />
                <small style={{
                  color: 'var(--color-text-light)',
                  fontSize: '0.85rem',
                  marginTop: '0.25rem'
                }}>
                  Formato: +57 seguido de 10 dígitos (opcional)
                </small>
              </div>
            </div>
          </div>

          {/* Información adicional */}
          <div className={styles.infoBox}>
            <div className={styles.infoTitle}>
              <span>ℹ️</span> Sobre las Notificaciones
            </div>
            <div className={styles.infoText}>
              Si proporcionas tu número de teléfono, podrás recibir alertas por SMS cuando se generen predicciones climáticas de riesgo alto o crítico (requiere configuración de Twilio).
            </div>
          </div>

          {/* Mensaje de estado */}
          {message && (
            <div className={`${styles.message} ${messageType === 'success' ? styles.messageSuccess : styles.messageError}`}>
              <span className={styles.messageIcon}>
                {messageType === 'success' ? '✓' : '✗'}
              </span>
              {message}
            </div>
          )}

          {/* Botones de acción */}
          <div className={styles.buttonGroup}>
            <button
              type="button"
              className={`${styles.button} ${styles.buttonSecondary}`}
              onClick={handleCancel}
              disabled={isLoading}
            >
              <span>↺</span> Cancelar
            </button>
            <button
              type="submit"
              className={`${styles.button} ${styles.buttonPrimary}`}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span>⟳</span> Guardando...
                </>
              ) : (
                <>
                  <span>💾</span> Guardar Cambios
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

