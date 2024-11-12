import React, { useState } from 'react';
import { Col, Row, Select, InputNumber } from 'antd';

interface ConfigurationTableSettingsProps {
  initialAmount: { budget: number };
  setInitialAmount: (amount: { budget: number }) => void;
  remainingBalance: { remaining_balance: number };
  changeThreshold: (threshold: string) => void;
  useTimeBased: boolean; 
}

const ConfigurationTableSettings: React.FC<ConfigurationTableSettingsProps> = ({
  initialAmount,
  setInitialAmount,
  remainingBalance,
  changeThreshold,
  useTimeBased,
}) => {

  const [previewData, setPreviewData] = useState<{ budget: Number, threshold : string } | null>(null);
  const seePreview =() => {
    setPreviewData({
      budget: initialAmount.budget,
      threshold: useTimeBased ? 'Time' : 'Budget'
    })
  }

 
  return (
    <Row gutter={{ xs: 8, sm: 16, md: 24, lg: 32 }}>
      <Col span={5}>
        <InputNumber
          addonBefore="Budget"
          id="inputBudget"
          min={1}
          max={100_000_000}
          formatter={(value) => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
          parser={(value) => value?.replace(/\$\s?|(,*)/g, '') as unknown as number}
          value={initialAmount.budget}
          onChange={(newValue) => setInitialAmount({ budget: newValue })}
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
        <button type="submit" onClick={seePreview} className="see-preview">
          Preview
        </button>
        <button type="submit" className="config-save">
          Save
        </button>
      </Col>
    </Row>
  );
};

export default ConfigurationTableSettings;