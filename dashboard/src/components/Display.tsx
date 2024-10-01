import React, {useState , useEffect, useRef } from 'react'

const Display = () => {

// calling data for current threshold amount, remaining aount, total request
    const [totalRequest, setTotalRequest] = useState({total_requests: 0})
    const [initialAmount, setInitialAmount] = useState({budget:0})
    const [remainingBalance, setRemainingBalance] = useState({remaining_balance: 0})
    const [budget, setBudget] = useState({budget: 0})


    useEffect(() => {
        const numberOfRequest = async () => {
            try{
                const response = await fetch('/dashboard/totalRequests');
                const number = await response.json();

                // console.log('number of Request in the Display function', number)
                
             
                setTotalRequest(number[0]) // {total_requests: 5}

            } catch (error) {
                console.log('error found from frontend fetching totalRequest')
            }
        }
        
        const initialValue = async () => {
            try {
         const response = await fetch('/dashboard/initialAmount')
         const initial = await response.json()

        //  console.log('checking initialAmount', initial) //{ budget: 100 }
         setInitialAmount(initial[0])
        } catch(error) {
            console.log('error found from frontend fetching initialAmount')
        }
        }

        const remainingBalance = async () => {
            try{
                const response = await fetch('/dashboard/remaining_balance');
                const remaining = await response.json()

                // console.log('remaining balance from front', remaining)

                setRemainingBalance(remaining[0])
            }catch(error) {
                console.log('error found from frontend fetching remainingBalance')
            }
        }
        
        numberOfRequest();
        initialValue();
        remainingBalance ()
    },[])

// console.log('totalRequest Number', totalRequest)
// console.log('initialAmount from front', initialAmount )
// console.log('remainingBalance from front', remainingBalance )
return (


<div className = "overview">
    <div className = "item budget">
        <p>Budget</p>
        <h5>${initialAmount.budget}</h5>
    </div>
    <div className = "item remaining-amount">
        <p>Remaining Balance</p>
        <h5>${remainingBalance.remaining_balance}</h5>
    </div>
    <div className = "item total-request">
        <p>Total Requests</p>
        <h5>{totalRequest.total_requests}</h5>
    
    </div>
</div>

)

}

export default Display