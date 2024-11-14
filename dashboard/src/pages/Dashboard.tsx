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
        <>
            <Row>
                <Col span={4}>
                    <Display />
                </Col>
                <Col span={10}>
                    <ThresholdsPieChart currentTheme={currentTheme} lightTheme={lightTheme}/>       
                </Col>
            </Row>
            <Row>
                <Col span={10}>
                    <BarChart />
                </Col>
            </Row>
        </>
    )
}
export default Dashboard;
