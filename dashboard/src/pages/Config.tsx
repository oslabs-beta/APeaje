import React, { useEffect, useState } from 'react';
import { Button, Table, InputNumber, Select, Card, TimePicker } from 'antd';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import type { TableProps } from 'antd';
import Display from '../components/Display';
import ConfigurationTableSettings from '../components/ConfigurationTableSettings';
import ThresholdsPieChart from '../components/ThresholdsPieChart';
import PreviousChange from '../components/PreviousChange';

const Config = ({currentTheme, lightTheme}) => {
  const [inputBudget, setInputBudget] = useState<number>(0);
  const [initialBudget, setInitialBudget] = useState<number>(0);
  const [initialAmount, setInitialAmount] = useState({ budget: 0 });
  const [useTimeBased, setUseTimeBased] = useState(false);
  const [initialUseTimeBased, setInitialUseTimeBased] = useState(false);
  const [tierGroup, setTierGroup] = useState([]);

  interface BudgetInfo {
    id: number;
    api_name: string;
    budget: number;
    spent: number;
    total_spent: number;
  }

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
          value={tierInfo.percentThreshold}
          onChange={(val) => updatePercentThreshold(val, index)}
        />
      ),
    },
    {
      title: 'Money Budgeted',
      key: 'budgeted',
      render: (_, tierInfo) => {
        const budget = (inputBudget * (tierInfo.percentThreshold / 100));
        return budget.toFixed(2);
      }
    },
    {
      title: 'Amount Spent',
      key: 'spent',
      render: (_, tierInfo) => (tierInfo.spent || 0).toFixed(2)
    },
    {
      title: 'Amount Left',
      key: 'amountLeft',
      render: (_, tierInfo) => {
        const budgeted = inputBudget * (tierInfo.percentThreshold / 100);
        return (budgeted - (tierInfo.spent || 0)).toFixed(2);
      }
    }
  ];

  const [tableColumns, setTableColumns] = useState(columns);

    const fetchData = async () => {
      try {
        const budgetResponse = await fetch(`/api-config/openai/budget`);
        const budgetInfo = await budgetResponse.json();

        if (isInitialLoad) {
          setInputBudget(budgetInfo.budget);
          setIsInitialLoad(false);
        }
        setInitialBudget(budgetInfo.budget);
        setInitialAmount({ budget: budgetInfo.budget });

        await fetchUseTimeBasedTier();

        const remainingBalanceResponse = await fetch('/dashboard/remaining_balance');
        const remainingBalance = await remainingBalanceResponse.json();
        setRemainingBalance(remainingBalance[0]);

        const thresholdsResponse = await fetch('/dashboard/thresholdsChart');
        const thresholdsData = await thresholdsResponse.json();

        const processedTiers = thresholdsData.map(tier => {
          const tierConfig = JSON.parse(tier.tier_config);
          const thresholds = JSON.parse(tier.thresholds || '{}');
          const tierSpent = Number(tier.spent) || 0;

          return {
            id: tier.tier_name,
            model: tierConfig.model,
            quality: tierConfig.quality,
            size: tierConfig.size,
            price: tier.cost,
            percentThreshold: thresholds.percentage ?? 0,
            request_count: tier.request_count ?? 0,
            spent: tierSpent,
            startTime: thresholds.time?.start || "00:00",
            endTime: thresholds.time?.end || "00:00"
          };
        });

        setTierGroup(processedTiers);

        const totalSpent = processedTiers.reduce((sum, tier) => sum + tier.spent, 0);
        setRemainingBalance({
          remaining_balance: inputBudget - totalSpent
        });

      } catch (error) {
        console.error('Error:', error);
      }
    };
    
    useEffect(() => {
    fetchData();
  }, [inputBudget, isInitialLoad]);

  const fetchUseTimeBasedTier = async () => {
    try {
      const response = await fetch('/api-config/openai/use-time-based-tier');
      const { useTimeBasedTier } = await response.json();
      setUseTimeBased(useTimeBasedTier);
      setInitialUseTimeBased(useTimeBasedTier);
      changeThreshold(useTimeBasedTier ? 'time' : 'budget');
    } catch (error) {
      console.error('Error fetching use_time_based_tier setting:', error);
    }
  };

  const updatePercentThreshold = (val: number | null | undefined, index: number) => {
    if (val === undefined || val === null) return;

    setTierGroup(prevTierGroup => {
      return prevTierGroup.map((tier, idx) => {
        if (idx === index) {
          return {
            ...tier,
            percentThreshold: val
          };
        }
        return tier;
      });
    });
  };

  const handleTime = (times: [Dayjs, Dayjs] | null, index: number): void => {
    if (!times) return;
    setTierGroup(prevTierGroup =>
      prevTierGroup.map((tier, idx) => {
        if (idx === index) {
          return {
            ...tier,
            startTime: times[0].format('HH:mm'),
            endTime: times[1].format('HH:mm')
          };
        }
        return tier;
      })
    );
  };

  const saveConfig = async (e: React.SyntheticEvent) => {
    e.preventDefault();

    try {
      const payload: any = {
        api_name: 'openai'
      };

      if (inputBudget !== initialBudget) {
        payload.budget = inputBudget;
      }

      const formattedThresholds = tierGroup.reduce((acc, tier) => {
        const currentThresholds = JSON.parse(tier.thresholds || '{}');

        acc[tier.id] = {
          percentage: useTimeBased ?
            (currentThresholds.percentage ?? tier.percentThreshold ?? 0) :
            tier.percentThreshold,
          time: useTimeBased ?
            {
              start: tier.startTime || currentThresholds.time?.start || "00:00",
              end: tier.endTime || currentThresholds.time?.end || "00:00"
            } :
            (currentThresholds.time ?? {
              start: tier.startTime || "00:00",
              end: tier.endTime || "00:00"
            })
        };

        return acc;
      }, {});

      payload.thresholds = formattedThresholds;
      console.log('payload.thresholds', payload.thresholds)

      if (useTimeBased !== initialUseTimeBased) {
        payload.use_time_based_tier = useTimeBased;
      }

      const response = await fetch('/api-config/openai/save', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save configuration');
      }

      const savedData = await response.json();

      if (savedData.budget) {
        setInitialBudget(savedData.budget.budget);
        setInitialAmount({ budget: savedData.budget.budget });
      }

      if (savedData.thresholds) {
        const updatedTiers = tierGroup.map(tier => {
          const updatedThreshold = savedData.thresholds.find(
            (t: any) => t.tier_name === tier.id
          );

          if (updatedThreshold) {
            const thresholds = JSON.parse(updatedThreshold.thresholds);
            return {
              ...tier,
              percentThreshold: thresholds.percentage ?? tier.percentThreshold ?? 0,
              startTime: thresholds.time?.start || tier.startTime || "00:00",
              endTime: thresholds.time?.end || tier.endTime || "00:00"
            };
          }
          return tier;
        });

        setTierGroup(updatedTiers);
      }

      if (savedData.settings) {
        setInitialUseTimeBased(!!savedData.settings.use_time_based_tier);
      }

      alert('Configuration saved successfully');
    } catch (error: any) {
      console.error('Error saving configuration:', error);
      alert(error.message || 'Failed to save configuration');
    }
  };

  const changeThreshold = (threshold: string): void => {
    setUseTimeBased(threshold === 'time');
    if (threshold === 'budget') {
      setTableColumns(columns);
    } else {
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
              value={[
                dayjs(tierInfo.startTime, 'HH:mm'),
                dayjs(tierInfo.endTime, 'HH:mm')
              ]}
              onChange={(times) => handleTime(times as [Dayjs, Dayjs], index)}
            />
          ),
        },
      ]);
    }
  };
  type chart ={
    name: string;
    value: number;
    initialAmount: { budget:number}
    thresholdAmount: number; 
  }


  const pieChartData = tierGroup.map(tier => ({
    name: tier.id,
    initialAmount: {budget: initialAmount.budget },
    value: (tier.percentThreshold/100) * initialAmount.budget,
    thresholdPercent: tier.percentThreshold
  }))

  return (
    <div className='dashboard'>
      <div className = 'display'>
      <Display />
      <ThresholdsPieChart currentTheme={currentTheme} lightTheme={lightTheme}/>
      <PreviousChange
        currentTheme={currentTheme} 
        lightTheme={lightTheme} 
        chart = {pieChartData}
      />
      </div>
      <form onSubmit={saveConfig}>
        <Table
          className='tiersTable'
          pagination={false}
          dataSource={tierGroup}
          columns={tableColumns}
          title={() => (
            <ConfigurationTableSettings
              title="New Budget"
              initialAmount={initialAmount}
              setInitialAmount={setInitialAmount}
              remainingBalance={remainingBalance}
              changeThreshold={changeThreshold}
              useTimeBased={useTimeBased}
              inputBudget={inputBudget}
              setInputBudget={setInputBudget}
            />
          )}
          rowKey={(record) => record.id}
        />
      </form>
    </div>
  );
};

export default Config;
