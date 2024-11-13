import React from 'react';
import { useAuth } from '../components/AuthContext';

const Profile = () => {
  const { username, role } = useAuth();
  console.log('user', username);

  return (
    <>
      <h1>Profile</h1>
      <h2>USER: {username}</h2>
      <h2>ROLE: {role}</h2>
    </>
  );
};

export default Profile;
