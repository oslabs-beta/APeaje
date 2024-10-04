import React, { useState } from 'react';
import Dashboard from './Dashboard';
import '../../public/style.css';
import SideBar from '../components/SideBar'
import Header from '../components/Header'
import Config from './Config';
import Manage from './Manage';
import Profile from './Profile';
import { Route, Routes } from 'react-router-dom';
import { ConfigProvider,Col, Row } from 'antd';


const App = () => (
    <ConfigProvider
        theme={{
            token: {
                colorPrimary: "#294873",
                colorInfo: "#294873",
                colorSuccess: "#7dd551",
                colorWarning: "#e7a92d",
                colorError: "#d2191c",
                colorLink: "#2a5796",
                colorTextBase: "#ffffff",
                colorBgBase: "#000000",
                fontSize: 14,
                wireframe: false
            }
        }}
    >
        <div className = "App">
            <Row>
                <Col span={12}>
                    <SideBar />
                </Col>
                <Col span={12}>
                    <div className = "display">
                        <Header />
                        <Routes>
                            <Route path="/dashboard" index element={<Dashboard/>} />
                            <Route path="/configuration" element={<Config />} />
                            <Route path="/manage" element={<Manage />} />
                            <Route path="/profile" element={<Profile />} />
                        </Routes>
                    </div>
                </Col>
            </Row>
        </div>
    </ConfigProvider>
) 

export default App;
