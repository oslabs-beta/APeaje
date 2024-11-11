import React, {useEffect, useState } from 'react'
// import UserRow from '../components/manageTeam/UserRow'
import {Table} from 'antd';

const Manage: React.FC = () => {
    const [newRole , setNewRole] = useState<Role[]|null>()
    const [user, setUser] = useState<User[] | null>(null); 
    interface User {
        id: number;
        username: string;
        role: string; 
    
    }

    interface Role {
        id: number;
        role: string;
    }
    
        useEffect(() => {
            const fetchUsers = async () => {
              try {
                const response = await fetch("/dashboard/users");
                const users: User[] = await response.json();
        
                console.log("fetching users", users);
                /*
                  [
        {
            "id": 1,
            "username": "Felipe",
            "password": "$2b$10$pMAke8AkSwOBv85T6s1G4.eeQt3KEiJrLrkKEFbNTrapyRNgJSZQ6",
            "role": "superhero"
        },
        {
            "id": 2,
            "username": "test",
            "password": "$2b$10$ON0v3INfo75ff6I7rztnm.KJIDdsTuQUk7ZKS.mf3buoSkq/ElOUe",
            "role": "tester"
        },
        {
            "id": 3,
            "username": "candy",
            "password": "$2b$10$NHlUq79gBWbBtKMmV6oJeuEUBSOgpAtpIweNoims8OnKIHtG1Jgiy",
            "role": "admin"
        }
    ]
                */
                
                setUser(users);
              } catch (error) {
                console.log("error found from fetchData for users in manageTeam");
              }
            };
            fetchUsers();
          }, []);


const columns = [
    {
        title: 'Username',
        dataIndex: 'username',
        key: 'username'
    },
    {
        title: 'Role',
        dataIndex: 'role',
        key: 'role'
    },
    {
        title: 'Email Address',
        dataIndex: 'email_address',
        key: 'email_address'
    },
    {
        title: 'Authorization',
        dataIndex: 'authorization',
        key: 'authorization'
    }
]



return (
    <div className = 'manageBox'>
        <Table dataSource = {user} columns = {columns} pagination={false}/>
    </div>


)}

export default Manage