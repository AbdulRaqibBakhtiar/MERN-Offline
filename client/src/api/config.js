const hostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
const protocol = typeof window !== 'undefined' ? window.location.protocol : 'http:';

export const API_BASE_URL = (process.env.REACT_APP_API_BASE_URL || `${protocol}//${hostname}:5000`).replace(/\/$/, '');
