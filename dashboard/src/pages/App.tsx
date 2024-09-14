import React, { useState } from 'react';
import Dashboard from './Dashboard';
import '../../public/style.css';
import SideBar from '../components/SideBar'
import Header from '../components/Header'
import Config from './Config';
import Manage from './Manage';
import Profile from './Profile';
import { Route, Routes } from 'react-router-dom'



const App = () => (
    <div className = "App">
    <SideBar />
    <div className = "display">
    <Header />
        <Routes>
            <Route path="/dashboard" index element= {<Dashboard/>} />
            <Route path="/configuration" element= {<Config />} />
            <Route path="/manage" element= {<Manage />} />
            <Route path="/profile" element= {<Profile />} />
        </Routes>
    </div>
     </div>
) 

export default App;