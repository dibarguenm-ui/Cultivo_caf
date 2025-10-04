import axios from 'axios';

const API_URL = 'http://127.0.0.1:8000/api/';

export const registerUser = (data) => axios.post(`${API_URL}auth/register/`, data);
export const loginUser = (data) => axios.post(`${API_URL}auth/login/`, data);
export const refreshToken = (data) => axios.post(`${API_URL}auth/refresh/`, data);
export const getProfile = (token) => axios.get(`${API_URL}auth/profile/`, {
  headers: { Authorization: `Bearer ${token}` }
});
export const updateProfile = (data, token) => axios.put(`${API_URL}auth/profile/`, data, {
  headers: { Authorization: `Bearer ${token}` }
});
export const getUsers = (token) => axios.get(`${API_URL}users/`, {
  headers: { Authorization: `Bearer ${token}` }
});
