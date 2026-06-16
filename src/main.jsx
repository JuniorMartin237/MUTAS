// main.jsx - Version corrigée
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Supprimez cette ligne car elle cause l'erreur
// import 'react-hot-toast/dist/index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);