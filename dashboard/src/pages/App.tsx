import React, { useState } from 'react';
import Dashboard from './Dashboard';
import '../../public/style.css';
import SideBar from '../components/SideBar';
import HeaderComp from '../components/Header';
// import Config from './Config';
import ConfigRevised from "./ConfigRevised";
import Manage from './Manage';
import Profile from './Profile';
import Login from './Login';
import Register from './Register';
import { Route, Routes } from 'react-router-dom';
import ProtectedRoute from '../components/ProtectedRoute';
import { ConfigProvider, Layout, theme } from 'antd';

const { Header, Content, Sider, Footer } = Layout;

const App = () => {
  const lightTheme = 'defaultAlgorithm';
  const darkTheme = 'darkAlgorithm';
  const [currentTheme, setCurrentTheme] = useState(darkTheme);
  return (
    <ConfigProvider theme={{ algorithm: theme[currentTheme] }}>
      <div className='App'>
        <Layout id='layoutStyle'>
          <Sider width={200}>
            <SideBar />
          </Sider>
          <Layout>
            <Header>
              <HeaderComp
                setCurrentTheme={setCurrentTheme}
                currentTheme={currentTheme}
                lightTheme={lightTheme}
                darkTheme={darkTheme}
              />
            </Header>
            <Content style={{ padding: '0 24px', minHeight: 280 }}>
              <Routes>
                <Route path='/login' element={<Login />} />
                <Route path='/register' element={<Register />} />

                {/* Protected Routes */}
                <Route element={<ProtectedRoute />}>
                  <Route path='/dashboard' index element={<Dashboard />} />
                  <Route path='/configuration' element={<Config />} />
                  <Route path='/manage' element={<Manage />} />
                  <Route path='/profile' element={<Profile />} />
                </Route>
              </Routes>
            </Content>
            <Footer></Footer>
          </Layout>
        </Layout>
      </div>
    </ConfigProvider>
  );
};

export default App;
