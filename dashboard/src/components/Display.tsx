import React, { useState, useEffect } from 'react';

const Display = (): React.JSX.Element => {
    // Define the type of return state after API
    interface TotalRequest {
        total_requests: number;
    }

    interface InitialAmount {
        budget: number;
    }

    interface RemainingBalance {
        remaining_balance: number;
    }

    // Initialize state
    const [totalRequest, setTotalRequest] = useState<TotalRequest>({ total_requests: 0 });
    const [initialAmount, setInitialAmount] = useState<InitialAmount>({ budget: 0 });
    const [remainingBalance, setRemainingBalance] = useState<RemainingBalance>({ remaining_balance: 0 });

   
        const fetchData = async () => {
            try {
                const initialValueResponse = await fetch('/dashboard/initialAmount');
                const initialValue: InitialAmount[] = await initialValueResponse.json();
                setInitialAmount(initialValue[0]); // {budget: 0}

                const remainingBalanceResponse = await fetch('/dashboard/remaining_balance');
                const remainingBalance: RemainingBalance[] = await remainingBalanceResponse.json();
                setRemainingBalance(remainingBalance[0]);

                const numberOfRequestResponse = await fetch('/dashboard/totalRequests');
                const numberOfRequest: TotalRequest[] = await numberOfRequestResponse.json();
                setTotalRequest(numberOfRequest[0]); // { total_requests: 5 }
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        };
        useEffect(() => {
        fetchData();
    }, []); // Fetch data on component mount

    return (
        <div className="overview">
            <div className="item initialBudget">
                <p>Initial Budget</p>
                <h5>{initialAmount.budget}</h5>
            </div>
            <div className="item remaining-balance">
                <p>Remaining Balance</p>
                <h5>{remainingBalance.remaining_balance}</h5>
            </div>
            <div className="item total-request">
                <p>Total Requests</p>
                <h5>{totalRequest.total_requests}</h5>
            </div>
        </div>
    );
};

export default Display;