import axios from 'axios';
const API_URL = 'http://127.0.0.1:8000/api/';

export const verifyEmail = (email, code) => axios.post(`${API_URL}auth/verify/`, { email, code });
