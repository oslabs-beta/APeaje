import React, { useState, useEffect } from 'react';
import BarChart from '../components/BarChart';
import Display from '../components/Display';
import ThresholdsPieChart from '../components/ThresholdsPieChart';
import { Row, Col } from 'antd';

interface DashboardProps {
    currentTheme: string;
    lightTheme: string;
}

const Dashboard: React.FC<DashboardProps> = ({ currentTheme, lightTheme }) => {
    const [selectedValue, setSelectedValue] = useState('');

    return (
        <>
            <Row>
                <Col span={4}>
                    <Display standalone={true} />
                </Col>
                <Col span={10}>
                    <ThresholdsPieChart
                        currentTheme={currentTheme}
                        lightTheme={lightTheme}
                        standalone={true}
                    />
                </Col>
            </Row>
            <Row>
                <Col span={10}>
                    <BarChart />
                </Col>
            </Row>
        </>
    );
};

export default Dashboard;