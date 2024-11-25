import React, { useState, useEffect } from 'react';

interface DisplayProps {
    selectedApi?: string;
    initialBudget?: number;
    remainingBalance?: number;
    totalRequests?: number;
    standalone?: boolean;
}

const Display = ({
    selectedApi,
    initialBudget,
    remainingBalance,
    totalRequests,
    standalone = true
}: DisplayProps): React.JSX.Element => {
    const [displayData, setDisplayData] = useState({
        budget: initialBudget || 0,
        remaining: remainingBalance || 0,
        requests: totalRequests || 0
    });

    const fetchData = async () => {
        if (!standalone) return; // don't fetch if data is provided via props

        try {
            const initialValueResponse = await fetch('/dashboard/initialAmount');
            const initialValue = await initialValueResponse.json();

            const numberOfRequestResponse = await fetch('/dashboard/totalRequests');
            const numberOfRequest = await numberOfRequestResponse.json();

  
            const totalSpent = numberOfRequest[0].total_requests * 0.12;

            setDisplayData({
                budget: initialValue[0].budget,
                remaining: initialValue[0].budget - totalSpent,
                requests: numberOfRequest[0].total_requests
            });
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    };

    useEffect(() => {
        if (standalone) {
            fetchData();
        } else {
            setDisplayData({
                budget: initialBudget || 0,
                remaining: remainingBalance || 0,
                requests: totalRequests || 0
            });
        }
    }, [standalone, initialBudget, remainingBalance, totalRequests]);

    return (
        <div className="overview">
            <div className="item initialBudget">
                <p>Initial Budget</p>
                <h5>{displayData.budget}</h5>
            </div>
            <div className="item remaining-balance">
                <p>Remaining Balance</p>
                <h5>{displayData.remaining}</h5>
            </div>
            <div className="item total-request">
                <p>Total Requests</p>
                <h5>{displayData.requests}</h5>
            </div>
        </div>
    );
};

export default Display;