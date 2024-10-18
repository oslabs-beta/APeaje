import React from 'react';
import { sideBarComp } from './SideBarComp';
import { useLocation } from 'react-router-dom';
import { Col, Row, Switch } from 'antd';
import { MoonOutlined, SunOutlined } from '@ant-design/icons';

const Header = ( { setCurrentTheme, currentTheme, lightTheme, darkTheme } ) => {
  const location = useLocation();

  return (
    <Row>
        <Col flex='auto'>
            {sideBarComp.map((val) => (
                location.pathname === val.link ? <h3>{val.label}</h3> : ''
            ))}
        </Col>
        <Col flex='100px'>
            <Switch
            checkedChildren={<SunOutlined />}
            unCheckedChildren={<MoonOutlined />}
            onChange={() => setCurrentTheme(currentTheme === lightTheme ? darkTheme : lightTheme)}
            />
        </Col>
    </Row>
  );
};

export default Header;
