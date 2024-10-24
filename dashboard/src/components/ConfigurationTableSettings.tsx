import React, { useState } from 'react';
import { Col, Row, Select, InputNumber} from 'antd';

const ConfigurationTableSettings = ({ initialAmount, setInitialAmount, remainingBalance, changeThreshold }):React.JSX.Element => {
  
  return (
  <Row gutter={{ xs: 8, sm: 16, md: 24, lg: 32 }}>
    <Col span={5}>
      <InputNumber
      addonBefore="Budget" 
      id='inputBudget' 
      min={1} 
      max={100_000_000} 
      formatter={(value) => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
      parser={(value) => value?.replace(/\$\s?|(,*)/g, '') as unknown as number}
      value={initialAmount.budget}
      // onChange={(newValue) => setInitialAmount({budget: newValue})}
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
            (optionA?.label ?? '').toLowerCase().localeCompare((optionB?.label ?? '').toLowerCase())
            }
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
      <button type='submit' className='config-save'>
          Save
      </button>
    </Col>
  </Row>
)};

export default ConfigurationTableSettings;
