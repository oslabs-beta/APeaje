import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Card, Space, InputNumber, Select, Modal, Table, message } from 'antd';
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
    tiers: TierData[]; // Make sure this is properly typed as TierData[]
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
        { title: 'Model', dataIndex: 'model', type: 'text', required: true },
        { title: 'Quality', dataIndex: 'quality', type: 'text', required: true },
        { title: 'Size', dataIndex: 'size', type: 'text', required: true },
        { title: 'Price', dataIndex: 'price', type: 'number', required: true }
    ],
    initialBudget: 100
};

const AddModel: React.FC<AddModelProps> = ({ currentTheme, lightTheme }) => {
    const [form] = Form.useForm();
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [modelConfig, setModelConfig] = useState({
        name: OPENAI_PRESET.name,
        columns: OPENAI_PRESET.columns,
        tiers: OPENAI_PRESET.tiers  
    });
    const [showColumnModal, setShowColumnModal] = useState(false);
    const [editingColumn, setEditingColumn] = useState<ColumnConfig | null>(null);
    const [columnForm] = Form.useForm();
    const [tiers, setTiers] = useState<TierData[]>(OPENAI_PRESET.tiers);
    const [availableModels, setAvailableModels] = useState<string[]>([]);
    const [selectedModel, setSelectedModel] = useState<string>('');
    const [isEditingPreset, setIsEditingPreset] = useState(false);
    const [initialBudget, setInitialBudget] = useState<number>(OPENAI_PRESET.initialBudget);

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
        }
    };

    const handleModelSelect = (modelName: string) => {
        setSelectedModel(modelName);
        if (modelName === '') {
            // Reset to OpenAI preset for new model
            setModelConfig({
                name: OPENAI_PRESET.name,
                columns: OPENAI_PRESET.columns,
                tiers: []
            });
            setTiers(OPENAI_PRESET.tiers);
            setInitialBudget(OPENAI_PRESET.initialBudget);
            setIsEditingPreset(false);
        } else {
            fetchModelConfig(modelName);
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
                columns: OPENAI_PRESET.columns,
                tiers: processedTiers
            });

            setTiers(processedTiers);
            setInitialBudget(data.budget);
        } catch (error) {
            console.error('Error fetching model config:', error);
            message.error('Failed to fetch model configuration');
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

            // Convert tiers to the format expected by the backend
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
                thresholds: {
                    budget: tiers.map((tier, index) => ({
                        tier: tier.name,
                        threshold: 100 / tiers.length
                    }))
                }
            };

            let endpoint = '/api-config';
            let method = 'POST';

            if (selectedModel) {
                endpoint = `/api-config/${modelConfig.name}/save`;
                method = 'PUT';
            }

            const response = await fetch(endpoint, {
                method,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to save configuration');
            }

            message.success('Model configuration saved successfully');
            await fetchAvailableModels();

            if (!selectedModel) {
                setModelConfig({
                    name: OPENAI_PRESET.name,
                    columns: OPENAI_PRESET.columns,
                    tiers: []
                });
                setTiers(OPENAI_PRESET.tiers);
                setInitialBudget(OPENAI_PRESET.initialBudget);
            }
        } catch (error) {
            console.error('Error saving configuration:', error);
            message.error(error instanceof Error ? error.message : 'Failed to save configuration');
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


    const handleDeleteConfig = async () => {
        if (!selectedModel) {
            message.error('Please select a model to delete');
            return;
        }

        try {
            Modal.confirm({
                title: 'Delete Configuration',
                content: `Are you sure you want to delete the configuration for ${selectedModel}?`,
                okText: 'Yes',
                okType: 'danger',
                cancelText: 'No',
                onOk: async () => {
                    const response = await fetch(`/api-config/${selectedModel}`, {
                        method: 'DELETE',
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    });

                    if (!response.ok) {
                        const errorData = await response.json();
                        throw new Error(errorData.error || 'Failed to delete configuration');
                    }

                    message.success(`Configuration for ${selectedModel} deleted successfully`);
                    await fetchAvailableModels();

                    // Reset form state
                    setSelectedModel('');
                    setModelConfig({
                        name: OPENAI_PRESET.name,
                        columns: OPENAI_PRESET.columns,
                        tiers: []
                    });
                    setTiers(OPENAI_PRESET.tiers);
                    setInitialBudget(OPENAI_PRESET.initialBudget);
                    setIsEditingPreset(false);
                }
            });
        } catch (error) {
            console.error('Error deleting configuration:', error);
            message.error(error instanceof Error ? error.message : 'Failed to delete configuration');
        }
    };

    const handleTierChange = (index: number, field: string, value: any) => {
        const newTiers = [...tiers];
        newTiers[index][field] = value;
        setTiers(newTiers);
    };

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
        {
            title: 'Model',
            dataIndex: 'model',
            render: (text: string, _, index: number) => (
                <Input
                    value={text}
                    onChange={e => handleTierChange(index, 'model', e.target.value)}
                    disabled={!isEditingPreset && Boolean(selectedModel)}
                />
            )
        },
        {
            title: 'Quality',
            dataIndex: 'quality',
            render: (text: string, _, index: number) => (
                <Input
                    value={text}
                    onChange={e => handleTierChange(index, 'quality', e.target.value)}
                    disabled={!isEditingPreset && Boolean(selectedModel)}
                />
            )
        },
        {
            title: 'Size',
            dataIndex: 'size',
            render: (text: string, _, index: number) => (
                <Input
                    value={text}
                    onChange={e => handleTierChange(index, 'size', e.target.value)}
                    disabled={!isEditingPreset && Boolean(selectedModel)}
                />
            )
        },
        {
            title: 'Price',
            dataIndex: 'price',
            render: (value: number, _, index: number) => (
                <InputNumber
                    value={value}
                    onChange={(value) => handleTierChange(index, 'price', value)}
                    min={0}
                    step={0.01}
                    disabled={!isEditingPreset && Boolean(selectedModel)}
                />
            )
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_, __, index: number) => (
                <Button
                    type="text"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => handleDeleteTier(index)}
                    disabled={!isEditingPreset && Boolean(selectedModel)}
                />
            )
        }
    ];

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
                                    onClick={() => setIsEditingPreset(!isEditingPreset)}
                                >
                                    {isEditingPreset ? 'Cancel Editing' : 'Edit Structure'}
                                </Button>
                                <Button
                                    type="primary"
                                    danger
                                    icon={<DeleteOutlined />}
                                    onClick={handleDeleteConfig}
                                >
                                    Delete Configuration
                                </Button>
                            </>
                        )}
                    </Space>
                }
                extra={
                    <Space>
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
                                onChange={(value) => setInitialBudget(value ?? OPENAI_PRESET.initialBudget)}
                                min={0}
                                style={{ width: 200 }}
                            />
                        </Form.Item>
                    </Form>
                )}

                <Table
                    columns={columns}
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
            </Card>

            <Modal
                title="Delete Configuration"
                open={showDeleteModal}
                onOk={async () => {
                    await handleDeleteConfig();
                    setShowDeleteModal(false);
                }}
                onCancel={() => setShowDeleteModal(false)}
                okText="Delete"
                okButtonProps={{ danger: true }}
                cancelText="Cancel"
            >
                <p>Are you sure you want to delete this configuration? This action cannot be undone.</p>
            </Modal>
        </div>
    );
};

export default AddModel;