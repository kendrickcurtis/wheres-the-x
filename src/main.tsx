import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

console.log('🔍 [main.tsx] Application starting', { timestamp: new Date().toISOString() });

createRoot(document.getElementById('root')!).render(
  <App />
)
