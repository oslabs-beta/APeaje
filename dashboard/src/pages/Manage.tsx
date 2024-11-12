import React, { useEffect, useState } from 'react';
import { DownOutlined, UserOutlined } from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { Button, Table, message, Dropdown, Menu } from 'antd';
import { DeleteFilled as TrashcanIcon } from '@ant-design/icons';

const Manage: React.FC = () => {
  const [newRole, setNewRole] = useState<Role | null>(null);
  const [user, setUser] = useState<User[] | null>(null);
  const [isDeleted, setIsDeleted] = useState<boolean>(false);

  // Define User interface
  interface User {
    id: number;
    username: string;
    role: string;
    email: string;
  }

  // Define Role interface
  interface Role {
    id: number;
    role: string;
  }

  // Fetch users on component mount
    const fetchUsers = async () => {
      try {
        const response = await fetch('/dashboard/users');
        const users: User[] = await response.json();
        console.log('fetching users', users);
        setUser(users);
      } catch (error) {
        console.log('Error fetching users in manageTeam');
      }
    };

    useEffect(()=> {
    fetchUsers();
  }, []);

  // Delete user
  const deleteUser = async (userId: number): Promise<void> => {
    if (user) {
      const updatedUsers = user.filter((user) => user.id !== userId);
      setUser(updatedUsers);
      setIsDeleted(true);

      try {
        const response = await fetch(`/dashboard/users/${userId}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          message.success('User deleted successfully');
          fetchUsers();
        } else {
          message.error('Failed to delete user');
          // If API request fails, add the user back to the state
          setUser([...updatedUsers, user.find((u) => u.id === userId)!]);
        }
      } catch (error) {
        console.log('Error during delete request');
        message.error('Error deleting user');
      }
    }
  };

  // Define roles
  const newRoles: Role[] = [
    { id: 1, role: 'Owner' },
    { id: 2, role: 'Admin' },
    { id: 3, role: 'User' },
  ];

  // Handle role update
  const handleNewRoleClick = async (userId: number, roleName: string): Promise<void> => {
    console.log('roleId', roleName);
    try {
      const response = await fetch(`/dashboard/users/${userId}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ roleName}),
      });
      console.log('response', response)

      if (response.ok) {
        message.success('Role updated successfully');
        fetchUsers();
      } else {
        message.error('Failed to update role');
      }
    } catch (error) {
      console.error('Error updating role:', error);
      message.error('Error updating role');
    }
  };

  // Define table columns
  const columns = [
    {
      title: 'Username',
      dataIndex: 'username',
      key: 'username',
    },
    {
      title: 'Email Address',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
    },
    {
      title: 'New Assigned Role',
      dataIndex: '',
      key: 'newRole',
      render: (_: any, user: User) => (
        <Dropdown.Button
          overlay={
            <Menu
              items={newRoles.map((role) => ({
                key: role.id,
                label: role.role,
                onClick: () => handleNewRoleClick(user.id, role.role),
              }))}
            />
          }
        >
          New Assigned Role
        </Dropdown.Button>
      ),
    },
    {
      title: 'Action',
      dataIndex: '',
      key: 'action',
      render: (_: any, user: User) => (
        <Button
          key={user.id + '-Delete'}
          onClick={() => deleteUser(user.id)}
        >
          <TrashcanIcon />
        </Button>
      ),
    },
  ];

  // Update info form submission
  const updateInfo = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const data = {
      id: user?.map((u) => u.id), // You need to pass an array of user ids
      role: newRole, // The role object or id, depending on your API expectations
      isDeleted,
    };

    try {
      const response = await fetch('/manageTeam', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      // Handle the response if needed
    } catch (error) {
      console.error('Error saving data:', error);
    }
  };

  return (
    <div className="manageBox">
      <form onSubmit={updateInfo}>
      <Table dataSource = {user} columns = {columns} rowKey="id"/>
        {/* <Table dataSource={user || []} columns={columns} rowKey="id" /> */}
      </form>
    </div>
  );
};

export default Manage;