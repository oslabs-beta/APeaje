import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Radio, Button } from 'antd' ;
import { useAuth } from '../components/AuthContext';

interface UserResponse {
  userId: number;
  username: string;
  role: string;
  message: string;
}

const Register: React.FC = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('User');
  const { login, logout, isAuth } = useAuth();
  const navigate = useNavigate();

  const handleRegister = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    const response: Response = await fetch(
      '/api/register',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password, role, email }),
      }
    );

    const data: UserResponse = await response.json();
    console.log(data.message);
    if (data.message === 'User registered successfully') {
      login(data.username, data.role)
      navigate('/dashboard');
    } else {
      alert('Error registering user');
    }
  };

  const roleOptions = ['Owner','Admin','User']

  return (
    <div>
      <h2>Register</h2>
      <form onSubmit={handleRegister}>
        <Input
          type='text'
          placeholder='Username'
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <Input
          type='text'
          placeholder='Email'
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Input
          type='password'
          placeholder='Password'
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <h3>Role:</h3>
        <Radio.Group
          options={roleOptions}
          onChange={(e) => setRole(e.target.value)}
          value={role}
          optionType="button"
          buttonStyle="solid"
        />
        <Button htmlType='submit' type = 'primary'>Register</Button>
      </form>
    </div>
  );
};

export default Register;
