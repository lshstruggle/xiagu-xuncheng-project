import React, { useEffect, useState } from 'react';
import {
  Table,
  Button,
  Space,
  Input,
  Select,
  Card,
  Tag,
  Popconfirm,
  message,
  Tooltip,
  Badge,
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  CopyOutlined,
  ImportOutlined,
  ExportOutlined,
  EnvironmentOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { poiApi, poiTypeApi } from '../../api/poi';
import type { POI, POITypeConfig } from '../../types';

const { Option } = Select;

const POIManagement: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<POI[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [filters, setFilters] = useState({
    keyword: '',
    type: '',
    status: '',
    cityCode: '',
  });
  const [poiTypes, setPoiTypes] = useState<POITypeConfig[]>([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await poiApi.getList({
        page,
        pageSize,
        ...filters,
      });
      setData(res.list);
      setTotal(res.total);
    } finally {
      setLoading(false);
    }
  };

  const fetchPoiTypes = async () => {
    try {
      const types = await poiTypeApi.getList();
      setPoiTypes(types);
    } catch (error) {
      // 使用默认类型
      setPoiTypes([
        { id: '1', typeCode: 'blue_buff', typeName: '蓝Buff', icon: '', color: '#1890ff', description: '', isActive: true },
        { id: '2', typeCode: 'red_buff', typeName: '红Buff', icon: '', color: '#ff4d4f', description: '', isActive: true },
        { id: '3', typeCode: 'tower', typeName: '防御塔', icon: '', color: '#faad14', description: '', isActive: true },
        { id: '4', typeCode: 'spirit_lighthouse', typeName: '荣耀灯塔', icon: '', color: '#722ed1', description: '', isActive: true },
        { id: '5', typeCode: 'player_footprint', typeName: '选手足迹', icon: '', color: '#52c41a', description: '', isActive: true },
      ]);
    }
  };

  useEffect(() => {
    fetchData();
    fetchPoiTypes();
  }, [page, pageSize, filters]);

  const handleDelete = async (id: string) => {
    try {
      await poiApi.delete(id);
      message.success('删除成功');
      fetchData();
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handleClone = async (id: string) => {
    try {
      await poiApi.clone(id);
      message.success('复制成功');
      fetchData();
    } catch (error) {
      message.error('复制失败');
    }
  };

  const getTypeTag = (type: string) => {
    const typeConfig = poiTypes.find(t => t.typeCode === type);
    if (!typeConfig) return <Tag>{type}</Tag>;
    return (
      <Tag color={typeConfig.color}>
        {typeConfig.typeName}
      </Tag>
    );
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      width: 80,
      ellipsis: true,
    },
    {
      title: '名称',
      dataIndex: 'name',
      width: 150,
    },
    {
      title: '类型',
      dataIndex: 'type',
      width: 120,
      render: (type: string) => getTypeTag(type),
    },
    {
      title: '坐标',
      dataIndex: 'location',
      width: 180,
      render: (location: any) => (
        <Tooltip title={`${location?.coordinates?.[1]}, ${location?.coordinates?.[0]}`}>
          <span style={{ cursor: 'help' }}>
            <EnvironmentOutlined style={{ marginRight: 4 }} />
            {location?.coordinates?.[1]?.toFixed(4)}, {location?.coordinates?.[0]?.toFixed(4)}
          </span>
        </Tooltip>
      ),
    },
    {
      title: '触发半径',
      dataIndex: 'triggerRadius',
      width: 100,
      render: (radius: number) => `${radius}m`,
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 80,
      render: (status: string) => (
        <Badge
          status={status === 'active' ? 'success' : 'default'}
          text={status === 'active' ? '启用' : '禁用'}
        />
      ),
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      width: 80,
      sorter: (a: POI, b: POI) => a.priority - b.priority,
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      width: 160,
      render: (date: string) => new Date(date).toLocaleString(),
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      fixed: 'right' as const,
      render: (_: any, record: POI) => (
        <Space size="small">
          <Tooltip title="编辑">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => navigate(`/poi/edit/${record.id}`)}
            />
          </Tooltip>
          <Tooltip title="复制">
            <Button
              type="text"
              icon={<CopyOutlined />}
              onClick={() => handleClone(record.id)}
            />
          </Tooltip>
          <Popconfirm
            title="确认删除"
            description="删除后不可恢复，是否继续？"
            onConfirm={() => handleDelete(record.id)}
            okText="删除"
            cancelText="取消"
            okButtonProps={{ danger: true }}
          >
            <Tooltip title="删除">
              <Button type="text" danger icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const rowSelection = {
    selectedRowKeys,
    onChange: (newSelectedRowKeys: React.Key[]) => {
      setSelectedRowKeys(newSelectedRowKeys);
    },
  };

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <Space wrap style={{ marginBottom: 16 }}>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate('/poi/create')}
          >
            新增POI
          </Button>
          <Button icon={<ImportOutlined />}>批量导入</Button>
          <Button icon={<ExportOutlined />}>导出数据</Button>
          {selectedRowKeys.length > 0 && (
            <>
              <Button danger>批量删除</Button>
              <Button>批量启用</Button>
              <Button>批量禁用</Button>
            </>
          )}
        </Space>

        <Space wrap>
          <Input
            placeholder="搜索POI名称"
            prefix={<SearchOutlined />}
            value={filters.keyword}
            onChange={(e) => setFilters({ ...filters, keyword: e.target.value })}
            style={{ width: 200 }}
            allowClear
          />
          <Select
            placeholder="POI类型"
            value={filters.type || undefined}
            onChange={(value) => setFilters({ ...filters, type: value })}
            style={{ width: 150 }}
            allowClear
          >
            {poiTypes.map(type => (
              <Option key={type.typeCode} value={type.typeCode}>
                {type.typeName}
              </Option>
            ))}
          </Select>
          <Select
            placeholder="状态"
            value={filters.status || undefined}
            onChange={(value) => setFilters({ ...filters, status: value })}
            style={{ width: 120 }}
            allowClear
          >
            <Option value="active">启用</Option>
            <Option value="inactive">禁用</Option>
          </Select>
        </Space>
      </Card>

      <Card>
        <Table
          rowSelection={rowSelection}
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={loading}
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条`,
            onChange: (p, ps) => {
              setPage(p);
              setPageSize(ps || 20);
            },
          }}
          scroll={{ x: 1200 }}
        />
      </Card>
    </div>
  );
};

export default POIManagement;
