import react from 'react'
import { Link, useMatch, useResolvedPath } from 'react-router-dom'



const NavBar = () => {
return (
<>

<Link to="/" className ='main'><h1>APeaje</h1></Link>
<div className = 'nav-bar'>
    <ul>
        <CustomLink to="/" id="/">Home</CustomLink>
        <CustomLink to="/dashboard" id="dashboard">Dashboard</CustomLink>
        <CustomLink to="/config" id="config">Configuration</CustomLink>
        <CustomLink to="/login" id="login">Login</CustomLink>
    </ul>
</div>



</>

)}

function CustomLink({ to, children, ...props }) {
    const resolvedPath = useResolvedPath(to)
    const isActive = useMatch({ path: resolvedPath.pathname, end: true})
  
    return (
      <li className= {isActive ? "active" : "" }>
      <Link to={to} {...props} >
        {children}
      </Link>
      </li>
    )
  }




export default NavBar