import React,{useState} from 'react';
import { Col, Row, Select, InputNumber, Modal } from 'antd';
import PreviousChange from './PreviousChange';

interface ConfigurationTableSettingsProps {
  initialAmount: { budget: number };
  setInitialAmount: React.Dispatch<React.SetStateAction<{ budget: number }>>;
  remainingBalance: { remaining_balance: number };
  changeThreshold: (threshold: 'budget' | 'time') => void;
  useTimeBased: boolean;
  inputBudget: number;
  setInputBudget: (value: number) => void;
}

const ConfigurationTableSettings: React.FC<ConfigurationTableSettingsProps> = ({
  initialAmount,
  setInitialAmount,
  remainingBalance,
  changeThreshold,
  useTimeBased,
  inputBudget,
  setInputBudget,
}) => {

  const [previewData, setPreviewData] = useState<{ budget: Number, threshold : string } | null>(null);
  const seePreview =() => {
    setPreviewData({
      budget: initialAmount.budget,
      threshold: useTimeBased ? 'Time' : 'Budget'
    })
  }

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
          addonBefore="Budget"
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
        <button type = "button" onClick={seePreview} className ="see-preview">Preview</button>
        <button type="submit" className="config-save">
          Save
        </button>
      </Col>

          {previewData && (
            <Modal title="Preview Configuration"
            visible= {true}
            onCancel = {()=> setPreviewData(null)}
            footer = {[
              <button key="cancel" onClick={() => setPreviewData(null)}>
                Close
              </button>,
            ]}
            >
              <p><strong>Budget:</strong> ${previewData.budget.toLocaleString()}</p>
              <p><strong>Threshold:</strong> ${previewData.threshold}</p>
            </Modal>
          )}
    </Row>
  );
};

export default ConfigurationTableSettings;