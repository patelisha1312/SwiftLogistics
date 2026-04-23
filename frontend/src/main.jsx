import { StrictMode } from 'react'
import axios from 'axios';
axios.defaults.baseURL = 'http://localhost:5000';
axios.defaults.withCredentials = true;
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import "leaflet/dist/leaflet.css";

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)