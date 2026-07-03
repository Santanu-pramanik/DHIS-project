import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import PatientPublicView from './PatientPublicView.jsx'

// Simple path-based routing (no router library) — only handles the
// public QR-scan destination: /patient/view/:uid. Everything else
// falls back to the normal single-page app.
const pathMatch = window.location.pathname.match(/^\/patient\/view\/([A-Za-z0-9-]+)\/?$/i)

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {pathMatch ? <PatientPublicView uid={pathMatch[1]} /> : <App />}
  </StrictMode>,
)
