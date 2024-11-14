import React, { useState, useEffect } from 'react';
import BarChart from '../components/BarChart';
// import LineChart from '../components/LineChart';
import Display from '../components/Display';
// import PieChart from '../components/PieChart';
import ThresholdsPieChart from '../components/ThresholdsPieChart';
import { Row, Col } from 'antd';

const Dashboard = ({ currentTheme, lightTheme}) => {
const [selectedValue, setSelectedValue] = useState('');


return (    
    <div className ="dashboard">
    <div className = "outline">
    <div className = "sub">
    <Display />
    </div>
    <div className = "sub">
    <ThresholdsPieChart currentTheme={currentTheme} lightTheme={lightTheme} />
    </div>
    </div>
    <div className = "container">
    <BarChart />
    </div>
    </div>
    
    
)
}

    
    // <Row>
    //     <Col>
         
    //     </Col>
    //     <Col>
            
    //     </Col>
    // </Row>
    // <Row>
    //     <Col>
           
    //     </Col>
    // </Row>


    {/* dropdown menu for different chart */}
    {/* <select className="dropdown" value = {selectedValue} onChange={(e)=> setSelectedValue(e.target.value)}>
     {options.map((opt) => (
        <option key={opt.value} value = {opt.value}>
            {opt.label}
        </option>
     ))}
    </select> */}

export default Dashboard
