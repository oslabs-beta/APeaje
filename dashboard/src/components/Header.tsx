import React from 'react';
import {sideBarComp} from './SideBarComp'
import {useLocation} from 'react-router-dom'

const Header = () => {
    const location = useLocation();
    return (
        <div className="header">
            {sideBarComp.map((val) => (
                <h3 className ="headerName">{location.pathname === val.link ? val.label : ""}</h3>
            ))}
        </div>
    )
}

export default Header
