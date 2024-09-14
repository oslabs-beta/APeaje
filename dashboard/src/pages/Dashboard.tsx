import React, { useState, useEffect } from 'react';
import BarChart from '../components/BarChart'
import LineChart from '../components/LineChart'
import Display from '../components/Display'

const Dashboard = () => {
const [selectedValue, setSelectedValue] = useState('');

// storing the value and label in the option obj.
const options = [
{ value: 'Opt1', label: "Request Number & Cost"},
{ value: "Opt2", label: "Tiers & Cost"},
{ value: "Opt3", label: "Traffic on time"}

]

return (    
    <div className ="dashboard">
    <Display />
    <LineChart />
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