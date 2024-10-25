import React, { useState, useEffect } from 'react';
import BarChart from '../components/BarChart';
import LineChart from '../components/LineChart';
import Display from '../components/Display';
// import PieChart from '../components/PieChart';
import ThresholdsPieChart from '../components/ThresholdsPieChart'
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
            <ThresholdsPieChart />
        </Col>
    </Row>
    <Row>
        <Col>
            <BarChart />
        </Col>
    </Row>

    </div>
)
}


export default Dashboard
