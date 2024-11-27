import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './pages/App';
import { BrowserRouter as Router } from 'react-router-dom';

const root: any = createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    {/* <AuthProvider> */}
      <Router>
        <App />
      </Router>
    {/* </AuthProvider> */}
  </React.StrictMode>
);

export default root;
