import React, { ReactElement } from 'react';
import { HomeOutlined, LoginOutlined, ProfileOutlined, SettingOutlined, TeamOutlined } from '@ant-design/icons';

// export the array of objects to the SideBar for each tab.
// Define a TypeScript interface for the sidebar items
interface SidebarItem {
    label: string;
    icon: ReactElement;
    link: string;
}


export const sideBarComp:SidebarItem[] = [
    {
        label: "Dashboard", 
        icon: <HomeOutlined />,
        link: "/dashboard"
    },
    {
        label: "Configuration", 
        icon: <SettingOutlined />,
        link: "/configuration"
    },
    {
        label: "Manage Team", 
        icon: <TeamOutlined />,
        link: "/manage"
    },
    {
        label: "Profile", 
        icon: <ProfileOutlined />,
        link: "/profile"
    },
    {
        label: "Login", 
        icon: <LoginOutlined />,
        link: "/login"
    }
]
