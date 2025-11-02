import axios from 'axios';

// Base URL for API calls. In production set REACT_APP_API_URL to your backend URL (no trailing slash).
const baseURL = process.env.REACT_APP_API_URL || '';

const api = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

export default api;
