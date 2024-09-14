import React, {useState} from 'react'
import '../../public/style.css'
import {SideBarComp} from './SideBarComp'
import { useNavigate, useLocation } from 'react-router-dom';

const SideBar = () => {
    const location = useLocation(); // Hook to get the current route
    const navigate = useNavigate(); // Hook to navigate


    return (
        <div className = "sideBar">
            <ul className = "sidebarList">
        {SideBarComp.map((val, key) => (
            <li key={key} 
                className = {`listBox ${location.pathname === val.link ? 'active' : '' }`}
                onClick={()=> navigate(val.link)}> 
            {/* <div>{val.icon}</div>{" "} */}
            <div>{val.title}</div>
            </li>
            // <div to= `${data.link}`> 
            //     {data.icon} 
            //     {data.title}
            // </div>
        ))}

    </ul>
        </div>
    )

}


export default SideBar