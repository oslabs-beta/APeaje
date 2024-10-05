import React, { useState } from 'react';
import Dashboard from './Dashboard';
import '../../public/style.css';
import SideBar from '../components/SideBar'
import HeaderComp from '../components/Header'
import Config from './Config';
import Manage from './Manage';
import Profile from './Profile';
import { Route, Routes } from 'react-router-dom';
import { ConfigProvider, Layout } from 'antd';


const { Header, Content, Sider, Footer } = Layout;

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
            <Layout id="layoutStyle">
                <Header>
                    <HeaderComp />
                </Header>
                <Layout>
                    <Sider width={200}>
                        <SideBar />
                    </Sider>
                    <Content style={{ padding: '0 24px', minHeight: 280 }}>
                        <Routes>
                            <Route path="/dashboard" index element={<Dashboard/>} />
                            <Route path="/configuration" element={<Config />} />
                            <Route path="/manage" element={<Manage />} />
                            <Route path="/profile" element={<Profile />} />
                        </Routes>
                    </Content>
                </Layout>
                <Footer></Footer>
            </Layout>
        </div>
    </ConfigProvider>
) 

export default App;



{/* 
    <Layout style={layoutStyle}>
      <Header style={headerStyle}>Header</Header>
      <Layout>
        <Sider width="25%" style={siderStyle}>
          Sider
        </Sider>
        <Content style={contentStyle}>Content</Content>
      </Layout>
      <Footer style={footerStyle}>Footer</Footer>
    </Layout>


const headerStyle: React.CSSProperties = {
  textAlign: 'center',
  color: '#fff',
  height: 64,
  paddingInline: 48,
  lineHeight: '64px',
  backgroundColor: '#4096ff',
};

const contentStyle: React.CSSProperties = {
  textAlign: 'center',
  minHeight: 120,
  lineHeight: '120px',
  color: '#fff',
  backgroundColor: '#0958d9',
};

const siderStyle: React.CSSProperties = {
  textAlign: 'center',
  lineHeight: '120px',
  color: '#fff',
  backgroundColor: '#1677ff',
};

const footerStyle: React.CSSProperties = {
  textAlign: 'center',
  color: '#fff',
  backgroundColor: '#4096ff',
};

const layoutStyle = {
  borderRadius: 8,
  overflow: 'hidden',
  width: 'calc(50% - 8px)',
  maxWidth: 'calc(50% - 8px)',
};
*/}
