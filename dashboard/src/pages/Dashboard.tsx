import React, { useState, useEffect } from 'react';
import BarChart from '../components/BarChart';
import LineChart from '../components/LineChart';
import Display from '../components/Display';
import PieChart from '../components/PieChart';
import { Row, Col } from 'antd';

const Dashboard = () => {
const [selectedValue, setSelectedValue] = useState('');


return (    
    <div className ="dashboard">
    <Row>
        <Col>
            <Display />
        </Col>
        <Col>
            <LineChart />
        </Col>
        <Col>
            <PieChart />
        </Col>
    </Row>
    <Row>
        <Col>
            <BarChart />
        </Col>
    </Row>


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
