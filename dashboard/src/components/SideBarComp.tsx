import React from 'react';
// import homeIcon from '../../public/assets/home.png';
// import profileIcon from '../../public/assets/profile.png';
// import configIcon from '../../public/assets/setting.png';
// import teamicon from '../../public/assets/team.png';

// export the array of objects to the SideBar for each tab.
// Define a TypeScript interface for the sidebar items
// interface SidebarItem {
//     label: string;
//     // icon: string;
//     link: string;
// }


export const sideBarComp = [

    {
        label: "Dashboard", 
        // icon: homeIcon,
        link: "/dashboard"
    },
    {
        label: "Configuration", 
        // icon: configIcon,
        link: "/configuration"
    },
    {
        label: "Manage Team", 
        // icon: teamicon,
        link: "/manage"
    },
    {
        label: "Profile", 
        // icon: profileIcon,
        link: "/profile"
    },
    {
        label: "Login", 
        // icon: profileIcon,
        link: "/login"
    }
]
