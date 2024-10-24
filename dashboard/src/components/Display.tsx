import React, {useState , useEffect, useRef } from 'react';

const Display = ():React.JSX.Element => {

    // define the type of return state after API
    interface TotalRequest {
        total_requests: number;
    }

    interface InitialAmount {
        budget: number;
      }


    // calling data for current threshold amount, remaining aount, total request
    const [totalRequest, setTotalRequest] = useState<TotalRequest>({total_requests: 0})
    const [budget, setBudget] = useState({budget: 0})


    useEffect(() => {
        const fetchData = async () => {
            try {
                const numberOfRequestResponse = await fetch('/dashboard/totalRequests');
                const numberOfRequest: TotalRequest[] = await numberOfRequestResponse.json();
                setTotalRequest(numberOfRequest[0]); // { total_requests:5 }
            
                // const initialValueResponse = await fetch('/dashboard/initialAmount');
                // const initialValue: InitialAmount[] = await initialValueResponse.json()
                // setInitialAmount(initialValue[0]); // {budget: 0}

            } catch (error) {
                console.error('Error fetching data:', error);
            }
         } 
        fetchData();
    },[]);

    return (
        <div className = "overview">
            <div className = "item total-request">
                <p>Total Requests</p>
                <h5>{totalRequest.total_requests}</h5>
            </div>
        </div>
    )
}

export default Display;
