import React, {useEffect, useState}  from 'react'

interface User {
    id: number;
    username: string;
    role: string; 

}

const UserRow : React.FunctionComponent = () => {
    const [username, setUserame] = useState<string>('')
    const [user, setUser] = useState<User[] | null>(null); 

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
    

return (
  <div className = "row">
    {user ? (
      user.map(user => (
      <div key={user.id}>
        <div>{user.username} , 
          
          {user.role}</div>
      </div>
    ))
    ): (<h1>...Loading</h1>
    )}
  </div>
  )
}


export default UserRow;
