import React, { useEffect, useState } from 'react';
import { Button, Table, InputNumber, Select, Card, TimePicker } from 'antd';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import type { TableProps } from 'antd';
import Display from '../components/Display';
import ConfigurationTableSettings from '../components/ConfigurationTableSettings';
import ThresholdsPieChart from '../components/ThresholdsPieChart';
import PreviousChange from '../components/PreviousChange';
import { Col, Row } from 'antd';

interface ConfigProps {
  currentTheme: string;
  lightTheme: string;
}

interface TierInfo {
  id: string;
  model: string;
  quality: string;
  size: string;
  price: number;
  percentThreshold: number;
  spent: number;
  request_count?: number;
  startTime: string;
  endTime: string;
  thresholds?: string;
  amountSpent?: number;
}

interface RemainingBalance {
  remaining_balance: number;
}

const Config: React.FC<ConfigProps> = ({ currentTheme, lightTheme }) => {
  const [selectedApi, setSelectedApi] = useState<string>('openai');
  const [availableApis, setAvailableApis] = useState<string[]>([]);
  const [inputBudget, setInputBudget] = useState<number>(0);
  const [initialBudget, setInitialBudget] = useState<number>(0);
  const [initialAmount, setInitialAmount] = useState({ budget: 0 });
  const [useTimeBased, setUseTimeBased] = useState(false);
  const [initialUseTimeBased, setInitialUseTimeBased] = useState(false);
  const [tierGroup, setTierGroup] = useState<TierInfo[]>([]);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [remainingBalance, setRemainingBalance] = useState<RemainingBalance>({
    remaining_balance: 0,
  });
  const [tableColumns, setTableColumns] = useState<TableProps<TierInfo>['columns']>([]);
  const [totalRequests, setTotalRequests] = useState<number>(0);
  const [displayData, setDisplayData] = useState({
    initialBudget: 0,
    remainingBalance: 0,
    totalRequests: 0
  });


  // Add missing functions
  const updatePercentThreshold = (val: number | null | undefined, index: number) => {
    if (val === undefined || val === null) return;

    setTierGroup((prevTierGroup) => {
      return prevTierGroup.map((tier, idx) => {
        if (idx === index) {
          return {
            ...tier,
            percentThreshold: val,
          };
        }
        return tier;
      });
    });
  };

  const changeThreshold = (threshold: string): void => {
    setUseTimeBased(threshold === 'time');
    if (threshold === 'budget') {
      setTableColumns(budgetColumns);
    } else {
      setTableColumns(timeColumns);
    }
  };

  const handleTime = (times: [Dayjs, Dayjs] | null, index: number): void => {
    if (!times) return;
    setTierGroup((prevTierGroup) =>
      prevTierGroup.map((tier, idx) => {
        if (idx === index) {
          return {
            ...tier,
            startTime: times[0].format('HH:mm'),
            endTime: times[1].format('HH:mm'),
          };
        }
        return tier;
      })
    );
  };

  // Define columns
  const budgetColumns: TableProps<TierInfo>['columns'] = [
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
        const budget = inputBudget * (tierInfo.percentThreshold / 100);
        return budget.toFixed(2);
      },
    },
    {
      title: 'Amount Spent',
      key: 'spent',
      render: (_, tierInfo) => {
        const spentValue = typeof tierInfo.spent === 'number' ? tierInfo.spent : parseFloat(tierInfo.spent || '0');
        return spentValue.toFixed(2);
      },
    },
    {
      title: 'Amount Left',
      key: 'amountLeft',
      render: (_, tierInfo) => {
        const budgeted = inputBudget * (tierInfo.percentThreshold / 100);
        return (budgeted - (tierInfo.spent || 0)).toFixed(2);
      },
    },
  ];

  const timeColumns: TableProps<TierInfo>['columns'] = [
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
            dayjs(tierInfo.endTime, 'HH:mm'),
          ]}
          onChange={(times) => handleTime(times as [Dayjs, Dayjs], index)}
        />
      ),
    },
  ];

  // Fetch available APIs
  useEffect(() => {
    const fetchApis = async () => {
      try {
        const response = await fetch('/api-config');
        const data = await response.json();
        setAvailableApis(data.map(api => api.apiName));
      } catch (error) {
        console.error('Error fetching APIs:', error);
      }
    };
    fetchApis();
  }, []);

  const fetchData = async () => {
    try {
      const budgetResponse = await fetch(`/api-config/${selectedApi}/budget`);
      const budgetInfo = await budgetResponse.json();

      if (isInitialLoad) {
        setInputBudget(budgetInfo.budget);
        setIsInitialLoad(false);
      }
      setInitialBudget(budgetInfo.budget);
      setInitialAmount({ budget: budgetInfo.budget });

      await fetchUseTimeBasedTier();

      const dashboardResponse = await fetch(`/api-config/${selectedApi}/dashboard`);
      const dashboardData = await dashboardResponse.json();

      setRemainingBalance({
        remaining_balance: dashboardData.budget.budget - dashboardData.budget.spent
      });

      const processedTiers = dashboardData.tiers
        .filter(tier => tier.tier_name !== 'initialBudget')
        .map((tier) => {
          const tierConfig = JSON.parse(tier.tier_config);
          const thresholds = JSON.parse(tier.thresholds || '{}');

          return {
            id: tier.tier_name,
            model: tierConfig.model,
            quality: tierConfig.quality,
            size: tierConfig.size,
            price: tier.cost,
            percentThreshold: thresholds.percentage ?? 0,
            request_count: tier.request_count ?? 0,
            spent: tier.spent,
            startTime: thresholds.time?.start || '00:00',
            endTime: thresholds.time?.end || '00:00',
            thresholds: tier.thresholds,
          };
        });

      setTierGroup(processedTiers);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  useEffect(() => {
    if (selectedApi) {
      fetchData();
    }
  }, [selectedApi, isInitialLoad]);

  const fetchUseTimeBasedTier = async () => {
    try {
      const response = await fetch(`/api-config/${selectedApi}/use-time-based-tier`);
      const { useTimeBasedTier } = await response.json();
      setUseTimeBased(useTimeBasedTier);
      setInitialUseTimeBased(useTimeBasedTier);
      changeThreshold(useTimeBasedTier ? 'time' : 'budget');
    } catch (error) {
      console.error('Error fetching use_time_based_tier setting:', error);
    }
  };

  const saveConfig = async (e: React.SyntheticEvent) => {
    e.preventDefault();

    try {
      const payload: any = {
        api_name: selectedApi,
      };

      if (inputBudget !== initialBudget) {
        payload.budget = inputBudget;
      }

      const formattedThresholds = tierGroup.reduce((acc: Record<string, any>, tier) => {
        const currentThresholds = JSON.parse(tier.thresholds || '{}');

        acc[tier.id] = {
          percentage: useTimeBased
            ? currentThresholds.percentage ?? tier.percentThreshold ?? 0
            : tier.percentThreshold,
          time: useTimeBased
            ? {
              start: tier.startTime || currentThresholds.time?.start || '00:00',
              end: tier.endTime || currentThresholds.time?.end || '00:00',
            }
            : currentThresholds.time ?? {
              start: tier.startTime || '00:00',
              end: tier.endTime || '00:00',
            },
        };

        return acc;
      }, {});

      payload.thresholds = formattedThresholds;

      if (useTimeBased !== initialUseTimeBased) {
        payload.use_time_based_tier = useTimeBased;
      }

      const response = await fetch(`/api-config/${selectedApi}/save`, {
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

      alert('Configuration saved successfully');
      fetchData();
    } catch (error) {
      console.error('Error saving configuration:', error);
      alert(error.message || 'Failed to save configuration');
    }
  };

  return (
    <div className="dashboard">
      <Card style={{ marginBottom: '1rem' }}>
        <Select
          style={{ width: 200 }}
          placeholder="Select API"
          value={selectedApi}
          onChange={setSelectedApi}
        >
          {availableApis.map(api => (
            <Select.Option key={api} value={api}>{api}</Select.Option>
          ))}
        </Select>
      </Card>

      <div className="display">
        <Row>
          <Col span={4}>
            <Display />
          </Col>
          <Col span={10}>
            <ThresholdsPieChart
              currentTheme={currentTheme}
              lightTheme={lightTheme}
            />
          </Col>
          <Col span={10}>
            <PreviousChange
              currentTheme={currentTheme}
              lightTheme={lightTheme}
              chart={tierGroup.map((tier) => ({
                name: tier.id,
                initialAmount: { budget: initialAmount.budget },
                value: (tier.percentThreshold / 100) * initialAmount.budget,
                thresholdPercent: tier.percentThreshold,
              }))}
            />
          </Col>
        </Row>
      </div>

      <form onSubmit={saveConfig}>
        <Table
          className="tiersTable"
          pagination={false}
          dataSource={tierGroup}
          columns={tableColumns}
          title={() => (
            <ConfigurationTableSettings
              title={`${selectedApi} Budget Configuration`}
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