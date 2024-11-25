import React, { useState, useEffect } from 'react';
import { Card, Form, Input, Button, Space, InputNumber, Select, Modal, Table, message } from 'antd';
import { PlusOutlined, DeleteOutlined, EditOutlined, SaveOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

interface AddModelProps {
    currentTheme: string;
    lightTheme: string;
}

interface ColumnConfig {
    title: string;
    dataIndex: string;
    type: 'text' | 'number' | 'select';
    options?: string[];
    required: boolean;
}

interface ModelConfig {
    name: string;
    columns: ColumnConfig[];
    tiers: TierData[];
}

interface TierData {
    name: string;
    model: string;
    quality: string;
    size: string;
    price: number;
    [key: string]: any;
}

// OpenAI preset configuration
const OPENAI_PRESET = {
    name: 'openai',
    tiers: [
        {
            name: 'Basic',
            model: 'dall-e-2',
            quality: 'standard',
            size: '1024x1024',
            price: 0.02
        },
        {
            name: 'Standard',
            model: 'dall-e-3',
            quality: 'standard',
            size: '1024x1024',
            price: 0.04
        },
        {
            name: 'Premium',
            model: 'dall-e-3',
            quality: 'hd',
            size: '1024x1024',
            price: 0.08
        }
    ],
    columns: [
        { title: 'Model', dataIndex: 'model', type: 'text' as const, required: true },
        { title: 'Quality', dataIndex: 'quality', type: 'text' as const, required: true },
        { title: 'Size', dataIndex: 'size', type: 'text' as const, required: true },
        { title: 'Price', dataIndex: 'price', type: 'number' as const, required: true }
    ],
    initialBudget: 100
};

const DEFAULT_CONFIG = {
    name: '',
    columns: OPENAI_PRESET.columns as ColumnConfig[],
    tiers: [],
    initialBudget: null 
};


const AddModel: React.FC<AddModelProps> = ({ currentTheme, lightTheme }) => {
    const [form] = Form.useForm();
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [modelConfig, setModelConfig] = useState<ModelConfig>(DEFAULT_CONFIG);
    const [showColumnModal, setShowColumnModal] = useState(false);
    const [editingColumn, setEditingColumn] = useState<ColumnConfig | null>(null);
    const [columnForm] = Form.useForm();
    const [tiers, setTiers] = useState<TierData[]>([]);
    const [availableModels, setAvailableModels] = useState<string[]>([]);
    const [selectedModel, setSelectedModel] = useState<string>('');
    const [isEditingPreset, setIsEditingPreset] = useState(false);
    const [initialBudget, setInitialBudget] = useState<number | null>(null);
    const [showColumnManagement, setShowColumnManagement] = useState(true);

    useEffect(() => {
        fetchAvailableModels();
    }, []);

    const fetchAvailableModels = async () => {
        try {
            const response = await fetch('/api-config');
            const data = await response.json();
            setAvailableModels(data.map(api => api.apiName));
        } catch (error) {
            console.error('Error fetching available models:', error);
            message.error('Failed to fetch available models');
        }
    };

    const handleModelSelect = async (modelName: string) => {
        setSelectedModel(modelName);
        if (modelName === '') {
            setModelConfig(DEFAULT_CONFIG);
            setTiers([]);
            setIsEditingPreset(false);
            setShowColumnManagement(true); // Always show column management for new models
        } else {
            await fetchModelConfig(modelName);
            setShowColumnManagement(false); // Hide for existing models until Edit is clicked
        }
    };

    const fetchModelConfig = async (modelName: string) => {
        try {
            const response = await fetch(`/api-config/${modelName}`);
            const data = await response.json();

            const processedTiers: TierData[] = Object.entries(data.tiers).map(([name, config]: [string, any]) => ({
                name,
                model: config.model || '',
                quality: config.quality || '',
                size: config.size || '',
                price: config.price || 0,
                ...config
            }));

            setModelConfig({
                name: modelName,
                columns: OPENAI_PRESET.columns as ColumnConfig[],
                tiers: processedTiers
            });

            setTiers(processedTiers);
            setInitialBudget(data.budget);
        } catch (error) {
            console.error('Error fetching model config:', error);
            message.error('Failed to fetch model configuration');
        }
    };

    const handleDeleteConfig = async () => {
        try {
            const response = await fetch(`/api-config/${selectedModel}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                throw new Error('Failed to delete configuration');
            }

            message.success('Configuration deleted successfully');
            await fetchAvailableModels();

            // Reset form state but keep the budget
            setSelectedModel('');
            setModelConfig(DEFAULT_CONFIG);
            setTiers([]);
            setIsEditingPreset(false);
            setShowDeleteConfirm(false);
            setShowColumnManagement(false);
            // Don't reset initialBudget here
        } catch (error) {
            console.error('Error deleting configuration:', error);
            message.error('Failed to delete configuration');
        }
    };

    const handleSaveConfig = async () => {
        try {
            if (!modelConfig.name) {
                message.error('Please enter a model name');
                return;
            }

            if (tiers.length === 0) {
                message.error('Please add at least one tier');
                return;
            }

            if (!initialBudget && initialBudget !== 0) {
                message.error('Please enter an initial budget');
                return;
            }

            const formattedTiers = {};
            tiers.forEach(tier => {
                formattedTiers[tier.name] = {
                    model: tier.model,
                    quality: tier.quality,
                    size: tier.size,
                    price: tier.price
                };
            });

            const payload = {
                apiName: modelConfig.name,
                initialBudget,
                tiers: formattedTiers,
                columns: modelConfig.columns,
                thresholds: {
                    budget: tiers.map((tier, index) => ({
                        tier: tier.name,
                        threshold: 100 / tiers.length
                    }))
                }
            };

            const endpoint = selectedModel ? `/api-config/${selectedModel}/save` : '/api-config';
            const method = selectedModel ? 'PUT' : 'POST';

            const response = await fetch(endpoint, {
                method,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error('Failed to save configuration');
            }

            message.success('Configuration saved successfully');
            await fetchAvailableModels();

            if (!selectedModel) {
                setModelConfig(DEFAULT_CONFIG);
                setTiers([]);
                // Don't reset the budget here
            }
        } catch (error) {
            console.error('Error saving configuration:', error);
            message.error('Failed to save configuration');
        }
    };

    const handleAddTier = () => {
        const newTier: TierData = {
            name: `Tier ${tiers.length + 1}`,
            model: '',
            quality: '',
            size: '',
            price: 0
        };
        setTiers([...tiers, newTier]);
    };

    const handleDeleteTier = (index: number) => {
        const newTiers = [...tiers];
        newTiers.splice(index, 1);
        setTiers(newTiers);
    };

    const handleTierChange = (index: number, field: string, value: any) => {
        const newTiers = [...tiers];
        newTiers[index][field] = value;
        setTiers(newTiers);
    };

    const handleAddColumn = () => {
        setEditingColumn(null);
        columnForm.resetFields();
        setShowColumnModal(true);
    };

    const handleEditColumn = (column: ColumnConfig) => {
        setEditingColumn(column);
        columnForm.setFieldsValue(column);
        setShowColumnModal(true);
    };

    const handleColumnSave = () => {
        columnForm.validateFields().then((values) => {
            // Use the dataIndex value for both title and dataIndex
            const columnConfig = {
                title: values.dataIndex,
                dataIndex: values.dataIndex,
                type: values.type,
                required: values.required
            };

            const newColumns = [...modelConfig.columns];
            if (editingColumn) {
                const index = newColumns.findIndex(c => c.dataIndex === editingColumn.dataIndex);
                if (index !== -1) {
                    newColumns[index] = columnConfig;
                }
            } else {
                newColumns.push(columnConfig);
            }
            setModelConfig(prev => ({ ...prev, columns: newColumns }));
            setShowColumnModal(false);
        });
    };

    const handleDeleteColumn = (dataIndex: string) => {
        const newColumns = modelConfig.columns.filter(c => c.dataIndex !== dataIndex);
        setModelConfig(prev => ({ ...prev, columns: newColumns }));
    };

    const renderColumnControls = () => {
        const columns: ColumnsType<TierData> = [
            {
                title: 'Tier Name',
                dataIndex: 'name',
                render: (text: string, _, index: number) => (
                    <Input
                        value={text}
                        onChange={e => handleTierChange(index, 'name', e.target.value)}
                        disabled={!isEditingPreset && Boolean(selectedModel)}
                    />
                )
            },
            ...modelConfig.columns.map(column => ({
                title: (
                    <Space>
                        {column.dataIndex}
                        {(!selectedModel || showColumnManagement || isEditingPreset) && (
                            <Button
                                type="text"
                                icon={<EditOutlined />}
                                onClick={() => handleEditColumn(column)}
                                size="small"
                            />
                        )}
                    </Space>
                ),
                dataIndex: column.dataIndex,
                render: (text: string | number, _, index: number) => (
                    column.type === 'number' ? (
                        <InputNumber
                            value={text as number}
                            onChange={(value) => handleTierChange(index, column.dataIndex, value)}
                            min={0}
                            step={0.01}
                            disabled={!isEditingPreset && Boolean(selectedModel)}
                        />
                    ) : (
                        <Input
                            value={text as string}
                            onChange={e => handleTierChange(index, column.dataIndex, e.target.value)}
                            disabled={!isEditingPreset && Boolean(selectedModel)}
                        />
                    )
                )
            })),
            {
                title: 'Actions',
                key: 'actions',
                render: (_, __, index: number) => (
                    <Space>
                        <Button
                            type="text"
                            danger
                            icon={<DeleteOutlined />}
                            onClick={() => handleDeleteTier(index)}
                            disabled={!isEditingPreset && Boolean(selectedModel)}
                        />
                    </Space>
                )
            }
        ];

        return columns;
    };



    return (
        <div style={{ padding: '24px' }}>
            <Card
                title={
                    <Space>
                        <Select
                            style={{ width: 200 }}
                            placeholder="Select Model"
                            onChange={handleModelSelect}
                            value={selectedModel}
                        >
                            <Select.Option value="">Create New Model</Select.Option>
                            {availableModels.map(model => (
                                <Select.Option key={model} value={model}>{model}</Select.Option>
                            ))}
                        </Select>
                        {selectedModel && (
                            <>
                                <Button
                                    type="primary"
                                    ghost
                                    onClick={() => {
                                        setIsEditingPreset(!isEditingPreset);
                                        setShowColumnManagement(!isEditingPreset);
                                    }}
                                >
                                    {isEditingPreset ? 'Cancel Editing' : 'Edit Configuration'}
                                </Button>
                                <Button
                                    type="primary"
                                    danger
                                    icon={<DeleteOutlined />}
                                    onClick={() => setShowDeleteConfirm(true)}
                                >
                                    Delete Configuration
                                </Button>
                            </>
                        )}
                    </Space>
                }
                extra={
                    <Space>
                        {(!selectedModel || showColumnManagement || isEditingPreset) && (
                            <Button
                                type="default"
                                onClick={handleAddColumn}
                                icon={<PlusOutlined />}
                            >
                                Add Column
                            </Button>
                        )}
                        <Button
                            type="primary"
                            onClick={handleSaveConfig}
                            icon={<SaveOutlined />}
                        >
                            Save Configuration
                        </Button>
                    </Space>
                }
            >
                {/* Form section */}
                {(!selectedModel || isEditingPreset) && (
                    <Form form={form} layout="vertical" className="mb-4">
                        <Form.Item
                            label="Model Name"
                            required
                        >
                            <Input
                                value={modelConfig.name}
                                onChange={(e) => setModelConfig(prev => ({
                                    ...prev,
                                    name: e.target.value
                                }))}
                                disabled={Boolean(selectedModel && !isEditingPreset)}
                            />
                        </Form.Item>
                        <Form.Item label="Initial Budget">
                            <InputNumber
                                value={initialBudget}
                                onChange={(value) => setInitialBudget(value)}
                                min={0}
                                style={{ width: 200 }}
                                placeholder="Enter initial budget"
                            />
                        </Form.Item>
                    </Form>
                )}

                {/* Table section */}
                <Table
                    columns={renderColumnControls()}
                    dataSource={tiers}
                    pagination={false}
                    rowKey="name"
                    footer={() => (
                        <Button
                            type="dashed"
                            onClick={handleAddTier}
                            block
                            icon={<PlusOutlined />}
                            disabled={!isEditingPreset && Boolean(selectedModel)}
                        >
                            Add Tier
                        </Button>
                    )}
                />

                {/* Column Edit Modal */}
                <Modal
                    title={editingColumn ? 'Edit Column' : 'Add Column'}
                    open={showColumnModal}
                    onOk={handleColumnSave}
                    onCancel={() => setShowColumnModal(false)}
                >
                    <Form
                        form={columnForm}
                        layout="vertical"
                    >
                        <Form.Item
                            name="dataIndex"
                            label="Column Name"
                            rules={[{ required: true, message: 'Please enter column name' }]}
                        >
                            <Input />
                        </Form.Item>
                        <Form.Item
                            name="type"
                            label="Type"
                            rules={[{ required: true, message: 'Please select type' }]}
                        >
                            <Select>
                                <Select.Option value="text">Text</Select.Option>
                                <Select.Option value="number">Number</Select.Option>
                                <Select.Option value="select">Select</Select.Option>
                            </Select>
                        </Form.Item>
                        <Form.Item
                            name="required"
                            valuePropName="checked"
                        >
                            <input type="checkbox" /> Required
                        </Form.Item>
                    </Form>
                </Modal>

                {/* Delete Confirmation Modal */}
                <Modal
                    title="Delete Configuration"
                    open={showDeleteConfirm}
                    onOk={handleDeleteConfig}
                    onCancel={() => setShowDeleteConfirm(false)}
                    okText="Delete"
                    okButtonProps={{ danger: true }}
                    cancelText="Cancel"
                >
                    <p>Are you sure you want to delete this configuration? This action cannot be undone.</p>
                </Modal>
            </Card>
        </div>
    );
};

export default AddModel;