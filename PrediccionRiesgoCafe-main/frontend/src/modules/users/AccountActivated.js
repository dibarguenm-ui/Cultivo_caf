import React from 'react';
import styles from './LoginRegisterForm.module.css';

export default function AccountActivated() {
  return (
    <div className={styles.container}>
      <div className={styles.formBox}>
        <div className={styles.title}>¡Cuenta activada!</div>
        <p>Tu cuenta ha sido activada correctamente. Ya puedes iniciar sesión.</p>
      </div>
    </div>
  );
}
