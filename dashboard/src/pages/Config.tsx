import React, { useEffect, useState } from 'react';
import { Button, Table, InputNumber, Select, Card, TimePicker } from 'antd';
import type { Dayjs } from 'dayjs';
import type { TableProps } from 'antd';
import config from '../../../config';
import Display from '../components/Display';
import ConfigurationTableSettings from '../components/ConfigurationTableSettings';

import { DeleteFilled as TrashcanIcon } from '@ant-design/icons';

const Config = (): React.ReactNode => {
  const [inputBudget, setInputBudget] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [tiers, setTiers] = useState('');
  const [threshold, setThreshold] = useState('');
  const [initialAmount, setInitialAmount] = useState({ budget: 0 });

  const [tierGroup, setTierGroup] = useState([
    {
      id: 'A',
      model: 'dall-e-3',
      quality: 'hd',
      size: '1024x1792',
      price: 0.12,
      percentThreshold: 0,
    },
    {
      id: 'B',
      model: 'dall-e-3',
      quality: 'hd',
      size: '1024x1024',
      price: 0.08,
      percentThreshold: 0,
    },
    {
      id: 'C',
      model: 'dall-e-3',
      quality: 'standard',
      size: '1024x1792',
      price: 0.08,
      percentThreshold: 0,
    },
    {
      id: 'D',
      model: 'dall-e-3',
      quality: 'standard',
      size: '1024x1024',
      price: 0.04,
      percentThreshold: 0,
    },
    {
      id: 'E',
      model: 'dall-e-3',
      quality: 'standard',
      size: '512x512',
      price: 0.018,
      percentThreshold: 0,
    },
    {
      id: 'F',
      model: 'dall-e-3',
      quality: 'standard',
      size: '256x256',
      price: 0.016,
      percentThreshold: 0,
    },
  ]);

  // Tier selection for frontend
  type configType = {
    id: string;
    model: string;
    quality: string;
    size: string;
    price: number;
    percentThreshold: number;
  };

  const columns: TableProps<configType>['columns'] = [
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
      title: 'Percent dedicated',
      key: 'percentThreshold',
      render: (_, tierInfo, index) => (
        <InputNumber
          min={0}
          max={100}
          key={tierInfo.id + '-Threshold'}
          onChange={(val) => updatePercentThreshold(val, index)}
        />
      ),
    },
    {
      title: 'Money Budgeted',
      key: 'budgeted',
      render: (_, tierInfo) => {
        console.log('initialAmount :', initialAmount);
        console.log('tierInfo.percentThreshold :', tierInfo.percentThreshold);
        const budget = Math.round(initialAmount.budget / tierInfo.percentThreshold * 100) / 100;
        return budget === Infinity || Number.isNaN(budget)? 0 : budget;
      },
    },
    {
      title: 'Amount Spent',
      key: 'spent',
      dataIndex: 'spent',
    },
    {
      title: 'Amount Left',
      key: 'amountLeft',
      dataIndex: 'amountLeft',
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
  const [tableColumns, setTableColumns] = useState(columns);

  interface RemainingBalance {
    remaining_balance: number;
  }

  const [remainingBalance, setRemainingBalance] = useState<RemainingBalance>({
    remaining_balance: 0,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        interface InitialAmount {
          budget: number;
        }

        const initialValueResponse = await fetch('/dashboard/initialAmount');
        const initialValue: InitialAmount[] = await initialValueResponse.json();
        setInitialAmount(initialValue[0]); // {budget: 0}
        console.log('initialAmount :', initialAmount);

        const remainingBalanceResponse = await fetch(
          '/dashboard/remaining_balance'
        );
        const remainingBalance: RemainingBalance[] =
          await remainingBalanceResponse.json();
        setRemainingBalance(remainingBalance[0]);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
    fetchData();
  }, []);

  const updatePercentThreshold = (val, index: number) => {
    setTierGroup((prev) =>
      prev.map((elem) =>
        elem.id === tierGroup[index].id
          ? { ...elem, percentThreshold: val }
          : elem
      )
    );
  };

  const changePercentDedicated = (e): void => {
    console.log('e', e);
  };

  const handleStartTime = (e: React.SyntheticEvent): void => {
    setStartTime((e.target as HTMLInputElement).value);
  };

  const handleEndTime = (e: React.SyntheticEvent): void => {
    setEndTime((e.target as HTMLInputElement).value);
  };

  const handleTiers = (e: React.SyntheticEvent): void => {
    setTiers((e.target as HTMLInputElement).value);
  };

  const handleThreshold = (e: React.SyntheticEvent): void => {
    setThreshold((e.target as HTMLInputElement).value);
  };

  // Handle form submission
  const saveConfig = (e: React.SyntheticEvent) => {
    e.preventDefault(); // Prevent the default form submission

    // Validation (optional)

    interface dataType {
      budget: string;
      timeRange: {
        start: string;
        end: string;
      };
    }
    // data send to backend
    const data: dataType = {
      budget: inputBudget,
      timeRange: {
        start: startTime,
        end: endTime,
      },
    };

    try {
      const response: Promise<Response> = fetch('/configuration', {
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
      setStartTime('');
      setEndTime('');
      setTiers('');
      setThreshold('');
      alert('Budget saved successfully');
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

  const deleteTier = (tierId): void => {
    setTierGroup(tierGroup.filter((tier) => tier.id !== tierId));
  };

  const changeThreshold = (threshold): void => {
    if (threshold === 'budget') setTableColumns(columns);
    else {
      setTableColumns([
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
          title: 'Start Time',
          key: 'startTime',
          render: (_) => <TimePicker format={'HH:mm'} />,
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
      ]);
    }
  };

  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const onSelectChange = (selectedRowKeys, selectedRows, { type }) => {
    console.log('type :', type);
    console.log('selectedRows :', selectedRows);
    console.log('selectedRowKeys :', selectedRowKeys);

    setSelectedRowKeys(selectedRowKeys);
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

  type thresholdType = {
    value: string;
    label: string;
  };

  const createThresholdObject = (): thresholdType[] => {
    const thresholds: string[] = Object.keys(config.apis.openai.thresholds);
    const optionsForSelect: thresholdType[] = [
      { value: '', label: 'Select a Threshold' },
    ];
    thresholds.forEach((threshold) => {
      const thresholdKey = threshold.replace(/^[0-9a-zA-Z]/g, '');
      const thresholdLabel = threshold[0].toUpperCase() + threshold.slice(1);
      optionsForSelect.push({ value: thresholdKey, label: thresholdLabel });
    });

    return optionsForSelect;
  };

  const changeThresholdSelect = (target) => {
    console.log(target);
  };

  return (
    <div className='dashboard'>
      <Display />
      <form onSubmit={saveConfig}>
        <Table
          className='tiersTable'
          pagination={false}
          rowSelection={{ type: 'radio', ...rowSelection }}
          dataSource={tierGroup}
          columns={tableColumns}
          title={() => (
            <ConfigurationTableSettings
              initialAmount={initialAmount}
              setInitialAmount={setInitialAmount}
              remainingBalance={remainingBalance}
              changeThreshold={changeThreshold}
            />
          )}
          rowKey={(record) => record.id}
        />
      </form>
    </div>
  );
};
export default Config;
