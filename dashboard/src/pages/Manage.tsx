// import React, {useEffect, useState } from 'react'
// // import UserRow from '../components/manageTeam/UserRow'
// import { DownOutlined, UserOutlined } from '@ant-design/icons';
// import type { MenuProps } from 'antd';
// import {Button, Table, message, Dropdown, Menu} from 'antd';
// import { DeleteFilled as TrashcanIcon } from '@ant-design/icons';
// import { EmailOtpType } from '@supabase/supabase-js';

// const Manage: React.FC = () => {
//     const [newRole , setNewRole] = useState<Role[]|null>()
//     const [user, setUser] = useState<User[] | null>(null); 
//     const [isDeleted, setIsDeleted] = useState({isDeleted: false})
//     interface User {
//         id: number;
//         username: string;
//         role: string; 
//         email: string;
//     }

//     interface Role {
//         id: number;
//         role: string;
//     }

//         useEffect(() => {
//             const fetchUsers = async () => {
//               try {
//                 const response = await fetch("/dashboard/users");
//                 const users: User[] = await response.json();
        
//                 console.log("fetching users", users);
//                 /*
//                   [
//         {
//             "id": 1,
//             "username": "Felipe",
//             "password": "$2b$10$pMAke8AkSwOBv85T6s1G4.eeQt3KEiJrLrkKEFbNTrapyRNgJSZQ6",
//             "role": "superhero"
//         },
//         {
//             "id": 2,
//             "username": "test",
//             "password": "$2b$10$ON0v3INfo75ff6I7rztnm.KJIDdsTuQUk7ZKS.mf3buoSkq/ElOUe",
//             "role": "tester"
//         },
//         {
//             "id": 3,
//             "username": "candy",
//             "password": "$2b$10$NHlUq79gBWbBtKMmV6oJeuEUBSOgpAtpIweNoims8OnKIHtG1Jgiy",
//             "role": "admin"
//         }
//     ]
//                 */
                
//                 setUser(users);
//               } catch (error) {
//                 console.log("error found from fetchData for users in manageTeam");
//               }
//             };
//             fetchUsers();
//           }, []);

 

//   const deleteUser = async (userId:number): Promise<void> => {
//     if(user) {
//     const updateUsers = user.filter((user) => user.id !== userId)
//     setUser(updateUsers);
//     setIsDeleted({isDeleted: true});

//     try{
//       const response = await fetch(`/dashboard/users/${userId}`, {
//         method: 'DELETE',
//         headers: {
//           'Content-Type': 'application/json'
//         }
//       });

//       if(response.ok) {
//         message.success('User deleted successfully');
//       } else {
//         message.error('Failed to delete user');
//         // If the API request fails, add the user back to the state 
//         setUser([...updateUsers, user.find(u=> u.id === userId)])
//       }
//       } catch(error) {
//         console.log('found error from delete request')
//         message.error('Error deleting user')
//     }

//   };
// }

// const newRoles: Role[] = [
//     {id: 1, role: 'Owner'},
//     {id: 2, role: 'Administrator'},
//     {id: 3, role: 'User'},
//   ]

// //Handle Role update
//   const handleNewRoleClick = async (userId: number, roleId: number) => {
//     // Send PUT request to update the user role
//     console.log('roleId', roleId)
//     try{
//      const response = await fetch(`/dashboard/users/${userId}/role`, {
//         method: 'PUT',
//         headers : {
//             'Content-Type': 'application/json'
//         },
//         body: JSON.stringify({ roleId }), 
//      });

//      if (response.ok) {
//         message.success('Role updated successfully ')
//      } else {
//         message.error('Failed to update role')
//      }
//     }catch(error) {
//         console.error('Error updating role:', error)
//         message.error('Error updating role')
//     }
//   }
  

// //   const menuProps: MenuProps = {
// //    items: newRoles?.map(role => ({
// //     key: role.id, 
// //     label: role.role,
// //     onClick: handleNewRoleClick,
// //    })) || [],
// //   }

// const columns = [
//     {
//         title: 'Username',
//         dataIndex: 'username',
//         key: 'username'
//     },
//     {
//         title: 'Email Address',
//         dataIndex: 'email_address',
//         key: 'email_address'
//     },
//     {
//         title: 'Role',
//         dataIndex: 'role',
//         key: 'role'
//     },
 
//     {
//         title: 'New Assigned Role',
//         dataIndex: '',
//         key: 'newRole',
//         render: (_, user) => (
//             <Dropdown.Button 
//             overlay = {
//                 <Menu
//                     items = {newRoles.map((role) => ({
//                         key: role.id,
//                         label: role.role,
//                         onClick: () => handleNewRoleClick(user.id, role.id),
//                     }))}
//             />
//              }
//              >
//             New Assigned Role
//           </Dropdown.Button>
//         )
//     },
//     {
//         title: 'Action',
//         dataIndex: '',
//         key:'action',
//         render:(_, user) => (
//             <Button
//               key={user.id + '-Delete'}
//               onClick={() => deleteUser(user.id)}
//             >
//               {<TrashcanIcon />}
//             </Button>
//           ),
//     }
// ]

// const updateInfo = async(e: React.SyntheticEvent) => {
//   e.preventDefault();
  
//   type dataType = {
//     id: number;
//     email: string;
//     title: string;
//     isDeleted: boolean;
//   }

//   const data = {
//     id: {user},
//     role: newRole,
//     isDeleted: {isDeleted}
//   }
//   useEffect(()=> {
//     const saveButton = ()=> {

//       const response = fetch('/manageTeam', {
//         method: 'POST',
//         headers: {
//           'Content-Type' : 'application/json'
//         },
//         body: JSON.stringify(data),
//       })
//     }
//   })


// return (
//     <div className = 'manageBox'>
//       <form onSubmit = {updateInfo}>
//         <Table dataSource = {user} columns = {columns}/>

//         </form>
//     </div>
// )
// }
// }


// export default Manage