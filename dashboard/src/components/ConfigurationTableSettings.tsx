import React from 'react';
import { Col, Row, Select, InputNumber } from 'antd';

interface ConfigurationTableSettingsProps {
  title?: string; 
  initialAmount: { budget: number };
  setInitialAmount: React.Dispatch<React.SetStateAction<{ budget: number }>>;
  remainingBalance: { remaining_balance: number };
  changeThreshold: (threshold: string) => void;
  useTimeBased: boolean;
  inputBudget: number;
  setInputBudget: React.Dispatch<React.SetStateAction<number>>;
}

const ConfigurationTableSettings: React.FC<ConfigurationTableSettingsProps> = ({
  title,
  initialAmount,
  setInitialAmount,
  remainingBalance,
  changeThreshold,
  useTimeBased,
  inputBudget,
  setInputBudget,
}) => {
  const handleBudgetChange = (value: number | null) => {
    if (value !== null) {
      setInputBudget(value);
      setInitialAmount({ budget: value });
    }
  };

  return (
    <Row gutter={{ xs: 8, sm: 16, md: 24, lg: 32 }}>
      <Col span={5}>
        <InputNumber
          addonBefore="New Budget"
          id="inputBudget"
          min={1}
          max={100_000_000}
          formatter={(value) => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
          parser={(value) => value?.replace(/\$\s?|(,*)/g, '') as unknown as number}
          value={inputBudget}
          onChange={handleBudgetChange}
        />
      </Col>
      <Col span={7}>
        Remaining Balance: {remainingBalance.remaining_balance}
      </Col>
      <Col span={9}>
        <Select
          placeholder="Select a Threshold"
          optionFilterProp="label"
          className="configThresHoldSelector"
          filterSort={(optionA, optionB) =>
            (optionA?.label ?? '')
              .toLowerCase()
              .localeCompare((optionB?.label ?? '').toLowerCase())
          }
          value={useTimeBased ? 'time' : 'budget'}
          onChange={changeThreshold}
          options={[
            {
              value: 'budget',
              label: 'Budget',
            },
            {
              value: 'time',
              label: 'Time',
            },
          ]}
        />
      </Col>
      <Col span={3}>
        <button type="submit" className="config-save">
          Save
        </button>
      </Col>
    </Row>
  );
};

export default ConfigurationTableSettings;