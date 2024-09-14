import React, {useState , useEffect} from 'react'

const Display = () => {

// calling data for current threshold amount, remaining aount, total request



return (

<div className = "overview">
    <div className = "item budget">
        <p>Budget</p>
        <h5>$200.00</h5>
    </div>
    <div className = "item remaining-amount">
        <p>Remaining Balance</p>
        <h5>$76.00</h5>
    </div>
    <div className = "item total-request">
        <p>Total Requests</p>
        <h5>201</h5>
    </div>
</div>

)

}

export default Display
