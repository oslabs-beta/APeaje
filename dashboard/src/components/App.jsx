import React from 'react';
import BarChart from './BarChart';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext';
import Login from './Login';
import Register from './Register';
import Dashboard from './Dashboard';

const PrivateRoute: React.FC<{ element: React.ReactElement }> = ({ element }) => {
    const { user } = useAuth();
    return user ? element : <Navigate to="/login" />;
};

const App: React.FC = () => {
    return (
        <AuthProvider>
            <Router>
                <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/dashboard" element={<PrivateRoute element={<Dashboard />} />} />
                    <Route path="/" element={<Navigate to="/login" />} />
                </Routes>
            </Router>
        </AuthProvider>
    );
};


export default App;
