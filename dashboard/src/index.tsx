import React from 'react';
import { createRoot } from 'react-dom/client';
// import { createTheme } from '@mui/material/styles';
import App from './pages/App';
import 'bootstrap/dist/css/bootstrap.min.css';
import { BrowserRouter as Router} from 'react-router-dom'

const root : any = createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <Router>
    <App />
    </Router>
  </React.StrictMode>
  
);

export default root
