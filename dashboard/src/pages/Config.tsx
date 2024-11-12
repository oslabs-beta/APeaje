import React, { useEffect, useState } from 'react';
import { Button, Table, InputNumber, Select, Card, TimePicker } from 'antd';
import type { Dayjs } from 'dayjs';
import type { TableProps } from 'antd';
import config from '../../../config';
import Display from '../components/Display';
import ConfigurationTableSettings from '../components/ConfigurationTableSettings';
import ThresholdsPieChart from '../components/ThresholdsPieChart'
import PreviousChange from '../components/PreviousChange'
import { DeleteFilled as TrashcanIcon } from '@ant-design/icons';
import dayjs from 'dayjs';

const Config = (): React.ReactNode => {
  const [inputBudget, setInputBudget] = useState<number | undefined>(undefined);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [tiers, setTiers] = useState('');
  const [threshold, setThreshold] = useState('');
  console.log('what is the type of tiers', tiers);
  console.log('what is inputBudget', inputBudget);
  console.log('what is endTime', endTime);
  const [initialAmount, setInitialAmount] = useState({ budget: 0 });

  const [useTimeBased, setUseTimeBased] = useState(false);
  const [tierGroup, setTierGroup] = useState([]);

  interface BudgetInfo {
    id: number;
    api_name: string;
    budget: number;
    spent: number;
    total_spent: number;
  }

  // Tier selection for frontend
  type configType = {
    id: string;
    model: string;
    quality: string;
    size: string;
    price: number;
    percentThreshold: number;
    amountSpent: number;
    startTime: string;
    endTime: string;
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
          defaultValue={tierInfo.percentThreshold}
          onChange={(val) => updatePercentThreshold(val, index)}
        />
      ),
    },
    {
      title: 'Money Budgeted',
      key: 'budgeted',
      render: (_, tierInfo) => {
        const budget = Math.round(
          initialAmount.budget * (tierInfo.percentThreshold / 100)
        );
        return budget === Infinity || Number.isNaN(budget) ? 0 : budget;
      },
    },
    {
      title: 'Amount Spent',
      key: 'spent',
      dataIndex: 'spent',
      render: (_, tierInfo) => {
        return tierInfo.amountSpent;
      },
    },
    {
      title: 'Amount Left',
      key: 'amountLeft',
      dataIndex: 'amountLeft',
      render: (_, tierInfo) => {
        return (
          Math.round(initialAmount.budget * (tierInfo.percentThreshold / 100)) -
          tierInfo.amountSpent
        );
      },
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


    const fetchData = async () => {
      try {
        interface InitialAmount {
          budget: number;
        }

        interface RemainingBalance {
          remaining_balance: number;
        }

        // fetch the budget information for the "openai" API
        const budgetResponse = await fetch(`/api-config/openai/budget`);
        const budgetInfo: BudgetInfo = await budgetResponse.json();
        console.log('budgetInfo:', budgetInfo); // Add this console log
        setInputBudget(budgetInfo.budget);

        // fetch the use_time_based_tier setting and update the UI accordingly
        await fetchUseTimeBasedTier();

        // fetch the initial amount (total budget) from the server
        const initialValueResponse = await fetch('/dashboard/initialAmount');
        const initialValue: InitialAmount[] = await initialValueResponse.json();
        setInitialAmount(initialValue[0]);

        // fetch the remaining balance from the server
        const remainingBalanceResponse = await fetch('/dashboard/remaining_balance');
        const remainingBalance: RemainingBalance[] = await remainingBalanceResponse.json();
        setRemainingBalance(remainingBalance[0]);

        // fetch the thresholds data from the server
        const thresholdsResponse = await fetch('/dashboard/thresholdsChart');
        const thresholdsData = await thresholdsResponse.json();
        console.log('Thresholds data:', thresholdsData);

        // Process the tier data from the thresholds data
        const processedTiers = thresholdsData.map(tier => {
          try {
            const tierConfig = JSON.parse(tier.tier_config);
            const thresholds = JSON.parse(tier.thresholds || '{}');

            console.log('Processing tier:', {
              id: tier.tier_name,
              config: tierConfig,
              thresholds: thresholds
            });

            return {
              id: tier.tier_name,
              model: tierConfig.model,
              quality: tierConfig.quality,
              size: tierConfig.size,
              price: tier.cost,
              percentThreshold: thresholds.percentage || 0,
              amountSpent: 0,
              startTime: thresholds.time?.start || "00:00",
              endTime: thresholds.time?.end || "00:00"
            };
          } catch (e) {
            console.error('Error processing tier:', tier, e);
            return null;
          }
        }).filter(Boolean); // remove any null entries

        console.log('Processed tiers:', processedTiers);
        setTierGroup(processedTiers);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
    useEffect(() => {
    fetchData();
  }, []);

  const fetchUseTimeBasedTier = async () => {
    try {
      const response = await fetch('/api-config/openai/use-time-based-tier');
      const { useTimeBasedTier } = await response.json();
      setUseTimeBased(useTimeBasedTier);
      changeThreshold(useTimeBasedTier ? 'time' : 'budget');
    } catch (error) {
      console.error('Error fetching use_time_based_tier setting:', error);
    }
  };

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

  const handleTime = (e, index: number): void => {
    if (e.target.getAttribute('date-range') === 'start') {
      setTierGroup((prev) =>
        prev.map((elem) =>
          elem.id === tierGroup[index].id
            ? { ...elem, percentThreshold: index }
            : elem
        )
      );
    }
    else if (e.target.getAttribute('date-range') === 'end') {

    }
  };

  const handleEndTime = (e: React.SyntheticEvent): void => { };

  const handleTiers = (e: React.SyntheticEvent): void => {
    setTiers((e.target as HTMLInputElement).value);
  };

  const handleThreshold = (e: React.SyntheticEvent): void => {
    setThreshold((e.target as HTMLInputElement).value);
  };

  // save form
  const saveConfig = async (e: React.SyntheticEvent) => {
    e.preventDefault(); // Prevent the default form submission


    // get the selected tier
    const selectedTier = selectedRowKeys[0]; // Use the first selected key

    type dataType = {
      budget: number;
      timeRange: {
        start: string;
        end: string;
      };
      tiers: string;
      // threshold: string;
    };
    // create the data object to send to the backend
    const data: dataType = {
      budget: inputBudget ?? 0,
      timeRange: {
        start: startTime,
        end: endTime,
      },
      tiers: selectedTier,
      // threshold: threshold,
    };

    try {
      const response = await fetch('http://localhost:2024/configuration', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      console.log('response', response);
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      setInputBudget(undefined);
      setStartTime('');
      setEndTime('');
      setSelectedRowKeys([]);

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
          title: 'Time',
          key: 'time',
          render: (_, tierInfo, index) => (
            <TimePicker.RangePicker
              format={'HH:mm'}
              defaultValue={[
                dayjs(tierInfo.startTime, 'HH:mm'),
                dayjs(tierInfo.endTime, 'HH:mm'),
              ]}
              onClick={(e) => handleTime(e, index)}
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
  console.log('what is selectedRowKey', selectedRowKeys[0]);
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
      <div className = 'display'>
      <Display />
      <PreviousChange />
      <ThresholdsPieChart />
      </div>
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
              useTimeBased={useTimeBased}
            />
          )}
          rowKey={(record) => record.id}
        />
      </form>
    </div>
  );
};
export default Config;