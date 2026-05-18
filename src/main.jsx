import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import { NavBar } from './components/NavBar.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
        <BrowserRouter>
          <NavBar></NavBar>
           <App />
       </BrowserRouter>
    </AuthProvider>
    
  </StrictMode>,
)
