 import React, {useState} from 'react'


    const Config = () => {
        const [inputBudget, setInputBudget] = useState('');
        const [inputTimeRange, setInputTimeRange] = useState('')
    
        const handleChange = (e) => {
            setInputBudget(e.target.value)
        }

        const handleTimeRange = (e) => {
            setInputTimeRange(e.target.value)
        }
    
         // Handle form submission
         const saveConfig = (e) => {
            e.preventDefault(); // Prevent the default form submission
    
            // // Validation (optional)
            // if (isNaN(inputBudget) || parseFloat(inputBudget) < 0) {
            //     alert('Please enter a valid positive number.');
            //     return;
            // }
    
            // Save to local storage (or replace with API call)
            localStorage.setItem('budget', inputBudget);
    
            // Optionally reset the form or state
            setInputBudget('');
            alert('Budget saved successfully.');
        };
    
        return (
            <div className="dashboard">
                <form onSubmit={saveConfig}>
                    <label>
                        Budget:
                        <input 
                            className = "inputBuget"
                            type="text"
                            value={inputBudget}
                            onChange={handleChange}
                            placeholder="Enter budget"
                        />
                    </label>
                    <label>
                        Date Range: 
                        <input className = "inputOrganization"
                        type = "text"
                        value={inputTimeRange}
                        onChange= {handleTimeRange}/>
                         - 
                        <input type = 'text' />
                    </label>
                    <button type="submit" className="config-save">
                        Save
                    </button>
                </form>
            </div>
        );
    };
    
    
<<<<<<< HEAD
    export default Config;
=======
    export default Config;
>>>>>>> Dev
