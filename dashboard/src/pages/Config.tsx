 import React, {useEffect, useState} from 'react'
import { GeneratedIdentifierFlags } from 'typescript';
import { Table } from "antd";
import config from '../../../config'
import Display from '../components/Display'


    const Config = (): React.ReactNode => {
        const [inputBudget, setInputBudget] = useState('');
        const [startTime, setStartTime] = useState('');
        const [endTime, setEndTime] = useState('');
        const [tiers, setTiers] = useState('')
        const [threshold, setThreshold] = useState('')

        const handleChange = (e: React.SyntheticEvent):void => {
            setInputBudget((e.target as HTMLInputElement).value)
        }

        const handleStartTime= (e: React.SyntheticEvent):void => {
            setStartTime((e.target as HTMLInputElement).value)
        }

        const handleEndTime = (e: React.SyntheticEvent):void => {
            setEndTime((e.target as HTMLInputElement).value)
        }

        const handleTiers = (e: React.SyntheticEvent):void => {
            setTiers((e.target as HTMLInputElement).value)
        }

        const handleThreshold = (e: React.SyntheticEvent):void => {
            setThreshold((e.target as HTMLInputElement).value)
        }
    
         // Handle form submission
         const saveConfig = (e: React.SyntheticEvent) => {
            e.preventDefault(); // Prevent the default form submission
    
            // Validation (optional)

            interface dataType {
                budget: string, 
                timeRange: {
                    start: string,
                    end:string
                }
            }
            // data send to backend 
            const data: dataType = {
                budget: inputBudget,
                timeRange: {
                    start: startTime,
                    end: endTime
                },
            }

        try {

        const response:Promise<Response> = fetch('/configuration', {
            method: 'POST', 
            headers: {
                'Content-Type': 'application/json',
            }, 
            body: JSON.stringify(data),
        });
        
        console.log('response', response);
        // if (!response.ok) {
        //     throw new Error('Network response was not ok')
        // }
        setInputBudget('');
        setStartTime('')
        setEndTime('')
        setTiers('');
        setThreshold('')
        alert('Budget saved successfully');
    
        } catch (error) {
            console.error('error found from configuration', error);
            alert('Failed to save configuration. Please try again.')
        } 
        };
    

        // Generate hours for dropdown (24 hours)

        const generateHours:() => React.ReactNode[] = () => {
            const hours:React.ReactNode[] = [];
            for (let i:number = 0; i < 24; i++) {
                const hour:string = i < 10 ? `0${i}:00` : `${i}:00`;
                hours.push(<option className="hours" key ={i} value={hour}>{hour}</option>)
            }
            return hours;
        }


        // Tier selection for frontend 
        type configType = {
            id: string,
            model: string,
            quality: string,
            size: string,
            price: number, 
        }

        const tierGroup: configType[] =
            [
                { id: 'A', model: 'dall-e-3', quality: 'hd', size: '1024x1792', price: 0.120 },
                { id: 'B', model: 'dall-e-3', quality: 'hd', size: '1024x1024', price: 0.080 },
                { id: 'C', model: 'dall-e-3', quality: 'standard', size: '1024x1792', price: 0.080 },
                { id: 'D', model: 'dall-e-3', quality: 'standard', size: '1024x1024', price: 0.040 },
                { id: 'E', model: 'dall-e-3', quality: 'standard', size: '512x512', price: 0.018 },
                { id: 'F', model: 'dall-e-3', quality: 'standard', size: '256x256', price: 0.016 }
            ]

        type columnType = {
            [key:string]: string
        }
        const columns: columnType[] = [
            {
                title: 'Tier',
                dataIndex: 'id',
                key:'id'
            },
            {
                title: 'Model',
                dataIndex: 'model',
                key:'model'
            },
            {
                title: 'Quality',
                dataIndex: 'quality',
                key:'quality'
            },
            {
                title: 'Size',
                dataIndex: 'size',
                key:'size'
            },
            {
                title: 'Price',
                dataIndex: 'price',
                key:'price'
            }
        ];

        const [selectedRowKeys, setSelectedRowKeys] = useState([]);
        const onSelectChange = (newSelectedRowKeys) => {
          console.log('selectedRowKeys changed: ', newSelectedRowKeys);
          setSelectedRowKeys(newSelectedRowKeys);
        };
        const rowSelection = {
          selectedRowKeys,
          onChange: onSelectChange,
        };

        //  const generateTiers2 = () => {
        //      return Object.entries(config.apis.openai.tiers).map(([key, tier]) => (
        //          <option key={key} value = {key}>
        //              {tier.key} ({tier.quality}, {tier.size}) - ${tier.price}
        //        </option>
        //     ));

        const generateThresholds = () => {
            return config.apis.openai.thresholds.budget.map(({ threshold, tier}) => (
                <option key={tier} value={tier}>
                    ${threshold} (Tier {tier})
                </option>
            ))
        }

        return (
            <div className="dashboard">
                <Display />
                <form onSubmit={saveConfig}>
                    <label>
                        Budget:
                        <input 
                            className = "inputBudget"
                            type="text"
                            value={inputBudget}
                            onChange={handleChange}
                            placeholder="Enter budget"
                        />
                    </label>
                    <label>
                        Start Time: 
                        <select className="timeRange" value = {startTime} onChange={handleStartTime}>
                            <option value = "">Select Start Time</option> 
                            {generateHours()}
                        </select>
                    </label>
                    <label>
                        End Time: 
                        <select className="timeRange" value = {endTime} onChange={handleEndTime}>
                            <option value = ""> Select End Time</option>
                            {generateHours()}
                        </select>
                    </label>

                    <label>
                        Tiers:
                        <select className="tiers" value = {tiers} onChange={handleTiers}>
                            <option value="" className="tier-table">Select Tiers</option> 
                            {/* {generateTiers2()} */}
                        </select>
                        {/* <table>{generateTiers()}</table> */}
                        <Table className='tiersTable' rowSelection={{type:'radio', ...rowSelection}} dataSource={tierGroup} columns={columns} />;
                    </label>

                    <label>
                        Thresholds: 
                        <select className="thresholds" value = {threshold} onChange={handleThreshold}>
                            <option value=""> Select Thresholds </option>
                            {generateThresholds()}

                        </select>
                    </label>

                    
                    <button type="submit" className="config-save">
                        Save
                    </button>
                </form>
            </div>
        );
    };
    export default Config;
