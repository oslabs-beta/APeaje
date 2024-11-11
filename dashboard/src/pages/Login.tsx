import React, { useState } from 'react';
import { useAuth } from '../components/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Input, Button } from 'antd';

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { login, logout, isAuth } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const response = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const data = await response.json();
    if (data.token) {
      login(data.username, data.role);
      navigate('/dashboard');
    } else {
      alert('Invalid credentials');
    }
  };

  const handleLogout = async (e: React.FormEvent) => {
    e.preventDefault();
    logout();
  };
  return (
    <div>
      <form onSubmit={handleLogin}>
        <Input
          type='text'
          placeholder='Username or Email'
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <Input
          type='password'
          placeholder='Password'
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Button htmlType='submit' type='primary'>
          Login
        </Button>
      </form>
      <Button onClick={handleLogout}>Logout</Button>
      <p>
        Don't have an account? <Link to='/register'>Register here</Link>
      </p>
    </div>
  );
};

export default Login;
