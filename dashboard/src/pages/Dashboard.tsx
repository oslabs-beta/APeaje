import React, { useState, useEffect } from 'react';
import BarChart from '../components/BarChart'
import LineChart from '../components/LineChart'
import Display from '../components/Display'
import PieChart from '../components/PieChart'

const Dashboard = () => {
const [selectedValue, setSelectedValue] = useState('');


return (    
    <div className ="dashboard">
    <Display />
    <LineChart />
    <PieChart />
    <BarChart />
    {/* dropdown menu for different chart */}
    {/* <select className="dropdown" value = {selectedValue} onChange={(e)=> setSelectedValue(e.target.value)}>
     {options.map((opt) => (
        <option key={opt.value} value = {opt.value}>
            {opt.label}
        </option>
     ))}
    </select> */}
    </div>
)
}


export default Dashboard