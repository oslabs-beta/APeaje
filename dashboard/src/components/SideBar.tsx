import React, {useState} from 'react';
import '../../public/style.css';
import {sideBarComp} from './SideBarComp';
import { useNavigate, useLocation } from 'react-router-dom';
import type { MenuProps } from 'antd';
import { Menu } from 'antd';
const SideBar = () => {
    const location = useLocation(); // Hook to get the current route
    const navigate = useNavigate(); // Hook to navigate

    type MenuItem = Required<MenuProps>['items'][number];

    const items: MenuItem[] = [];
    for (let i = 0; i < sideBarComp.length; i++) {
        const item = sideBarComp[i];
        items.push({
            key: item.link,
            label: (<div>{item.label}</div>)
        });
    }


    const onClick: MenuProps['onClick'] = (e): void => {
        console.log('click ', e);
        navigate(e.key);
    };

    interface LevelKeysProps {
        key?: string;
        children?: LevelKeysProps[];
    }

    return (
        <Menu
            mode="inline"
            style={{height: '100%' }}
            items={items}
            onClick={onClick}
        />
    )
}

export default SideBar
