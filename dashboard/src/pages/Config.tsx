import React, { useEffect, useState } from 'react';
import { Button, Table, InputNumber, Select, Card, TimePicker } from 'antd';
import type { Dayjs } from 'dayjs';
import type { TableProps } from 'antd';
import config from '../../../config';
import Display from '../components/Display';
import ConfigurationTableSettings from '../components/ConfigurationTableSettings';
import { DeleteFilled as TrashcanIcon } from '@ant-design/icons';
import dayjs from 'dayjs';

const Config = (): React.ReactNode => {
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
          key={tierInfo.id + '-Threshold'}
          value={tierInfo.percentThreshold}
          onChange={(val) => updatePercentThreshold(val, index)}
          onBlur={() => console.log('Current tier group:', tierGroup)}
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
  const [remainingBalance, setRemainingBalance] = useState<{ remaining_balance: number }>({
    remaining_balance: 0,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch budget first
        const budgetResponse = await fetch(`/api-config/openai/budget`);
        const budgetInfo: BudgetInfo = await budgetResponse.json();
        console.log('Budget info:', budgetInfo);
        setInputBudget(budgetInfo.budget);
        setInitialBudget(budgetInfo.budget);
        setInitialAmount({ budget: budgetInfo.budget });

        // Fetch use_time_based_tier setting
        await fetchUseTimeBasedTier();

        // Fetch remaining balance
        const remainingBalanceResponse = await fetch('/dashboard/remaining_balance');
        const remainingBalance = await remainingBalanceResponse.json();
        setRemainingBalance(remainingBalance[0]);

        // Fetch thresholds
        const thresholdsResponse = await fetch('/dashboard/thresholdsChart');
        const thresholdsData = await thresholdsResponse.json();
        console.log('Thresholds data:', thresholdsData);

        const processedTiers = thresholdsData.map(tier => {
          try {
            const tierConfig = JSON.parse(tier.tier_config);
            const thresholds = JSON.parse(tier.thresholds || '{}');

            return {
              id: tier.tier_name,
              model: tierConfig.model,
              quality: tierConfig.quality,
              size: tierConfig.size,
              price: tier.cost,
              percentThreshold: thresholds.percentage ?? 0,
              amountSpent: tier.spent || 0,
              startTime: thresholds.time?.start || "00:00",
              endTime: thresholds.time?.end || "00:00"
            };
          } catch (e) {
            console.error('Error processing tier:', tier, e);
            return null;
          }
        }).filter(Boolean);

        console.log('Processed tiers:', processedTiers);
        setTierGroup(processedTiers);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
    fetchData();
  }, []);

  const fetchUseTimeBasedTier = async () => {
    try {
      const response = await fetch('/api-config/openai/use-time-based-tier');
      const { useTimeBasedTier } = await response.json();
      console.log('useTimeBasedTier:', useTimeBasedTier);
      setUseTimeBased(useTimeBasedTier);
      setInitialUseTimeBased(useTimeBasedTier);
      changeThreshold(useTimeBasedTier ? 'time' : 'budget');
    } catch (error) {
      console.error('Error fetching use_time_based_tier setting:', error);
    }
  };

  const updatePercentThreshold = (val: number | null | undefined, index: number) => {
    if (!tierGroup[index]) return;

    const updatedTierGroup = [...tierGroup];
    updatedTierGroup[index] = {
      ...updatedTierGroup[index],
      percentThreshold: val ?? updatedTierGroup[index].percentThreshold,
    };

    console.log('Updating tier', index, 'to value', val);
    console.log('Updated tier group:', updatedTierGroup);

    setTierGroup(updatedTierGroup);
  };

  const handleTime = (times: [Dayjs, Dayjs], index: number): void => {
    if (!times || !tierGroup[index]) return;
    setTierGroup(prev =>
      prev.map((tier, idx) => {
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

      // Only include budget if it changed
      if (inputBudget !== initialBudget) {
        payload.budget = inputBudget;
      }

      // Log current state before formatting
      console.log('Current tier group before save:', tierGroup);

      // Format thresholds based on current mode
      const formattedThresholds = tierGroup.reduce((acc, tier) => {
        // Make sure we're using the current values
        const currentThreshold = useTimeBased ?
          {
            percentage: null,
            time: {
              start: tier.startTime || "00:00",
              end: tier.endTime || "00:00"
            }
          } : {
            percentage: tier.percentThreshold,
            time: null
          };

        acc[tier.id] = currentThreshold;
        return acc;
      }, {});

      console.log('Formatted thresholds:', formattedThresholds);

      payload.thresholds = formattedThresholds;
      payload.use_time_based_tier = useTimeBased;

      console.log('Saving payload:', payload);

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

      // Update initial states
      setInitialUseTimeBased(useTimeBased);
      setInitialBudget(inputBudget);

      // Refresh all data
      const budgetResponse = await fetch(`/api-config/openai/budget`);
      const budgetInfo = await budgetResponse.json();
      setInputBudget(budgetInfo.budget);
      setInitialAmount({ budget: budgetInfo.budget });

      const thresholdsResponse = await fetch('/dashboard/thresholdsChart');
      const thresholdsData = await thresholdsResponse.json();

      const refreshedTiers = thresholdsData.map(tier => {
        try {
          const tierConfig = JSON.parse(tier.tier_config);
          const thresholds = JSON.parse(tier.thresholds || '{}');

          return {
            id: tier.tier_name,
            model: tierConfig.model,
            quality: tierConfig.quality,
            size: tierConfig.size,
            price: tier.cost,
            percentThreshold: thresholds.percentage ?? 0,
            amountSpent: tier.spent || 0,
            startTime: thresholds.time?.start || "00:00",
            endTime: thresholds.time?.end || "00:00"
          };
        } catch (e) {
          console.error('Error processing tier:', tier, e);
          return null;
        }
      }).filter(Boolean);

      console.log('Refreshed tiers:', refreshedTiers);
      setTierGroup(refreshedTiers);

      alert('Configuration saved successfully');
    } catch (error) {
      console.error('Error saving configuration:', error);
      alert(error.message || 'Failed to save configuration');
    }
  };

  const deleteTier = (tierId): void => {
    setTierGroup(tierGroup.filter((tier) => tier.id !== tierId));
  };

  const changeThreshold = (threshold): void => {
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
              onChange={(times) => handleTime(times, index)}
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
    setSelectedRowKeys(selectedRowKeys);
  };

  const rowSelection = {
    selectedRowKeys,
    onChange: onSelectChange,
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