import React from 'react';
import {SideBarComp} from './SideBarComp'
import {useLocation} from 'react-router-dom'

const Header = () => {
    const location = useLocation();
    return (
        <div className="header">
            {SideBarComp.map((val) => (
                <h3 className ="headerName">{location.pathname === val.link ? val.title : ""}</h3>
            ))}
        </div>
    )
}

export default Header