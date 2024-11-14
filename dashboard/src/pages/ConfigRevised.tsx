import React, { useEffect, useState } from 'react';
import { Button, Table, InputNumber, Select } from 'antd';
import type { TableProps } from 'antd';
import config from '../../../config';
import Display from '../components/Display';
import { OpenAIFilled, DeleteFilled as TrashcanIcon } from '@ant-design/icons';
import { Type } from 'typescript';
import { stringify } from 'querystring';
import ThresholdsPieChart from '../components/ThresholdsPieChart';


const Config = ({ currentTheme, lightTheme }): React.ReactNode => {
  const [inputBudget, setInputBudget] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  // const [tiers, setTiers] = useState('');
  const [thresholds, setThreshold] = useState({});
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);

  console.log('what is inputBudget', inputBudget);
  console.log('what is endTime', endTime);
  console.log('what is selectedRowKeys', selectedRowKeys);
  console.log('original thresholds', thresholds); // {A: 20, B: 10, C: 20}

  // Tier selection for frontend
  type ConfigType = {
    key: number;
    id: string;
    model: string;
    quality: string;
    size: string;
    price: number;
  };

  type SelectedTierType = {
    id: string;
    model: string;
    quality: string;
    size: string;
    price: number;
  };

  const [tierGroup, setTierGroup] = useState<ConfigType[]>([
    {
      key: 1,
      id: 'A',
      model: 'dall-e-3',
      quality: 'hd',
      size: '1024x1792',
      price: 0.12,
    },
    {
      key: 2,
      id: 'B',
      model: 'dall-e-3',
      quality: 'hd',
      size: '1024x1024',
      price: 0.08,
    },
    {
      key: 3,
      id: 'C',
      model: 'dall-e-3',
      quality: 'standard',
      size: '1024x1792',
      price: 0.08,
    },
    {
      key: 4,
      id: 'D',
      model: 'dall-e-3',
      quality: 'standard',
      size: '1024x1024',
      price: 0.04,
    },
    {
      key: 5,
      id: 'E',
      model: 'dall-e-3',
      quality: 'standard',
      size: '512x512',
      price: 0.018,
    },
    {
      key: 6,
      id: 'F',
      model: 'dall-e-3',
      quality: 'standard',
      size: '256x256',
      price: 0.016,
    },
  ]);

  const handleBudgetChange = (e: React.SyntheticEvent): void => {
    setInputBudget((e.target as HTMLInputElement).value);
  };

  const handleStartTime = (e: React.SyntheticEvent): void => {
    setStartTime((e.target as HTMLInputElement).value);
  };

  const handleEndTime = (e: React.SyntheticEvent): void => {
    setEndTime((e.target as HTMLInputElement).value);
  };



  const handleThresholdChange = (
    tierId: string,
    value: number | undefined
  ): void => {
    setThreshold((prev) => ({ ...prev, [tierId]: value || 0 }));
  };

  // Handle form submission
  const saveConfig = async (
    e: React.FormEvent<HTMLFormElement>
  ): Promise<void> => {
    e.preventDefault(); // Prevent the default form submission

    // Create the thresholds object
    const thresholdsObject = {};

    // Populate budget thresholds
    Object.entries(thresholds).forEach(([tier, percentage]) => {
      thresholdsObject[tier] = {
        percentage,
        time: selectedRowKeys.includes(tier)
          ? { start: parseInt(startTime, 10), end: parseInt(endTime, 10) }
          : undefined, // Optional time
      };
    });

    const data = {
      budget: inputBudget,
      api_name: 'openai',
      thresholds: thresholdsObject,
    };

    try {
      const response = await fetch(
        '/api-config/openai/thresholds',
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        }
      );

      console.log('response', response);
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

   
      setInputBudget('');
      setStartTime('');
      setEndTime('');
      setSelectedRowKeys([]);
      setThreshold([]);

      alert('Config saved successfully');
    } catch (error) {
      console.error('error found from configuration', error);
      alert('Failed to save configuration. Please try again.');
    }
  };

  // Generate hours for dropdown (24 hours)

  const generateHours: () => React.ReactNode[] = () => {
    const hours: React.ReactNode[] = [];
    for (let i: number = 0; i < 24; i++) {
      const hour: string = i < 10 ? `0${i}:00` : `${i}:00`;
      hours.push(
        <option className='hours' key={i} value={hour}>
          {hour}
        </option>
      );
    }
    return hours;
  };

  // deleteTier function
  const deleteTier = (tierId): void => {
    setTierGroup(tierGroup.filter((tier) => tier.id !== tierId));
  };

  const columns: TableProps<ConfigType>['columns'] = [
    {
      title: 'Tier',
      dataIndex: 'id',
      key: 'id',
    },
    {
      title: 'Model',
      dataIndex: 'model',
      key: 'model',
    },
    {
      title: 'Quality',
      dataIndex: 'quality',
      key: 'quality',
    },
    {
      title: 'Size',
      dataIndex: 'size',
      key: 'size',
    },
    {
      title: 'Price',
      dataIndex: 'price',
      key: 'price',
    },
    {
      title: 'Threshold',
      key: 'percentage',
      render: (_, tierInfo) => (
        <InputNumber
          min={0}
          onChange={(value) => handleThresholdChange(tierInfo.id, value)}
          key={tierInfo.id + '-Threshold'}
          value={thresholds[tierInfo.id] || 0}
        />
      ),
    },
    {
      title: 'Delete',
      key: 'delete',
      render: (_, tierInfo) => (
        <Button
          key={tierInfo.id + '-Delete'}
          onClick={() => deleteTier(tierInfo.id)}
        >
          {<TrashcanIcon />}
        </Button>
      ),
    },
  ];



  const onSelectChange = (newSelectedRowKeys: []): void => {
    console.log('selectedRowKeys changed: ', newSelectedRowKeys);
    setSelectedRowKeys(newSelectedRowKeys);
  };
  const rowSelection = {
    selectedRowKeys,
    onChange: onSelectChange,
  };



  return (
    <div className='dashboard'>
      <Display />
      < ThresholdsPieChart currentTheme={currentTheme} lightTheme={lightTheme}/>
      <form onSubmit={saveConfig}>
        <label>
          Budget:
          <input
            className='inputBudget'
            type='text'
            value={inputBudget}
            onChange={handleBudgetChange}
            placeholder='Enter budget'
          />
        </label>
        <label>
          Start Time:
          <select
            className='timeRange'
            value={startTime}
            onChange={handleStartTime}
          >
            <option value=''>Select Start Time</option>
            {generateHours()}
          </select>
        </label>
        <label>
          End Time:
          <select
            className='timeRange'
            value={endTime}
            onChange={handleEndTime}
          >
            <option value=''> Select End Time</option>
            {generateHours()}
          </select>
        </label>

        <label>
          Tiers:
          <Table
            className='tiersTable'
            pagination={false}
            rowSelection={rowSelection}
            dataSource={tierGroup}
            columns={columns}
          />
        </label>

        <button type='submit' className='config-save'>
          Save
        </button>
      </form>
    </div>
  );
};

export default Config;
