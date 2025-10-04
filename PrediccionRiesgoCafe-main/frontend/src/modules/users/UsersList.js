import React, { useEffect, useState, useContext } from 'react';
import { getUsers } from './api';
import { AuthContext } from './AuthContext';

export default function UsersList() {
  const { accessToken } = useContext(AuthContext);
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (accessToken) {
      getUsers(accessToken)
        .then(res => setUsers(res.data))
        .catch(() => setError('No se pudo obtener la lista de usuarios'));
    }
  }, [accessToken]);

  if (!accessToken) return <div>Debes iniciar sesión para ver los usuarios.</div>;
  if (error) return <div>{error}</div>;

  return (
    <div>
      <h2>Usuarios</h2>
      <ul>
        {users.map(user => (
          <li key={user.id}>{user.username} - {user.email}</li>
        ))}
      </ul>
    </div>
  );
}
