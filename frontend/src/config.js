const USE_LOCALHOST_SERVER = true;

const LOCALHOST_API_URL = 'https://clip-smart-ai-backend.onrender.com';
const EC2_API_URL = 'http://54.161.100.146:4001';
const LOCALHOSTS_API_URL = 'https://clip-smart-ai-backend.onrender.com';

export const API_URL =  USE_LOCALHOST_SERVER ? LOCALHOST_API_URL : LOCALHOSTS_API_URL;

export const YOUTUBE_API = `${API_URL}/api/v1/youtube`;
export const MERGE_API = `${API_URL}/api/merge`;
export const AUTH_API = `${API_URL}/api/v1/auth`;
export const PROJECTS_API = `${API_URL}/api/projects`;

export const PYTHON_API =  USE_LOCALHOST_SERVER ?  "http://54.161.100.146:5000" :  "https://clip-smart-ai-backend.onrender.com" ;


const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api';

export const USERS_API = `${API_BASE_URL}/users`;
export const CLIPS_API = `${API_BASE_URL}/clips`;
export const INITIAL_VERSION_API = `${API_BASE_URL}/initial-version`;
export const HEALTH_API = `${API_BASE_URL}/health`;
export const CONTACT_API = `${API_BASE_URL}/contact`;

const CONFIG = {
  API_URL,
  YOUTUBE_API,
  MERGE_API,
  AUTH_API,
  PROJECTS_API,
  USE_LOCALHOST_SERVER,
  PYTHON_API,
  USERS_API,
  CLIPS_API,
  INITIAL_VERSION_API,
  HEALTH_API,
  CONTACT_API
};

export default CONFIG;
