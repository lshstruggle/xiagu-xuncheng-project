import React, { useEffect, useState } from 'react';
import {
  Card,
  Button,
  Table,
  Tag,
  Space,
  Input,
  Select,
  message,
  Popconfirm,
  Modal,
  Form,
  Statistic,
  Row,
  Col,
  Descriptions,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  TrophyOutlined,
  SearchOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import { easterEggApi } from '../../api/easterEgg';

const { Option } = Select;

const EasterEggManagement: React.FC = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [filters, setFilters] = useState({
    keyword: '',
    type: '',
    rarity: '',
    status: '',
  });
  const [stats, setStats] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [editingEgg, setEditingEgg] = useState<any>(null);
  const [viewingEgg, setViewingEgg] = useState<any>(null);
  const [form] = Form.useForm();

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await easterEggApi.getList({
        page,
        pageSize,
        ...filters,
      });
      // 转换 snake_case 到 camelCase
      const normalizedList = res.list.map((item: any) => ({
        ...item,
        id: item.id || item._id,
        triggerCondition: item.triggerCondition || item.trigger_condition,
        createdAt: item.createdAt || item.created_at,
        updatedAt: item.updatedAt || item.updated_at,
      }));
      setData(normalizedList);
      setTotal(res.total);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await easterEggApi.getStats();
      setStats(res);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchData();
    fetchStats();
  }, [page, pageSize, filters]);

  const handleDelete = async (id: string) => {
    try {
      await easterEggApi.delete(id);
      message.success('删除成功');
      fetchData();
      fetchStats();
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handleViewDetail = (record: any) => {
    setViewingEgg(record);
    setIsDetailModalOpen(true);
  };

  const handleEdit = (record: any) => {
    setEditingEgg(record);
    form.setFieldsValue(record);
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setEditingEgg(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      if (editingEgg) {
        await easterEggApi.update(editingEgg.id || editingEgg._id, values);
        message.success('更新成功');
      } else {
        await easterEggApi.create(values);
        message.success('创建成功');
      }
      setIsModalOpen(false);
      fetchData();
      fetchStats();
    } catch (error) {
      message.error('保存失败');
    }
  };

  const getRarityTag = (rarity: string) => {
    const map: Record<string, { color: string; text: string }> = {
      legendary: { color: 'gold', text: '传说' },
      epic: { color: 'purple', text: '史诗' },
      rare: { color: 'blue', text: '稀有' },
      common: { color: 'default', text: '普通' },
    };
    const info = map[rarity] || { color: 'default', text: rarity };
    return <Tag color={info.color}>{info.text}</Tag>;
  };

  const columns = [
    { title: '彩蛋名称', dataIndex: 'name', width: 180 },
    {
      title: '类型',
      dataIndex: 'type',
      width: 120,
      render: (type: string) => {
        const map: Record<string, string> = {
          checkin: '打卡彩蛋',
          bond: '羁绊彩蛋',
          collection: '收集彩蛋',
          special: '特殊彩蛋',
        };
        return map[type] || type;
      },
    },
    {
      title: '稀有度',
      dataIndex: 'rarity',
      width: 100,
      render: (r: string) => getRarityTag(r),
    },
    {
      title: '触发条件',
      dataIndex: 'triggerCondition',
      ellipsis: true,
      render: (text: string, record: any) => text || record.trigger || '-',
    },
    {
      title: '位置',
      width: 180,
      render: (_: any, record: any) => {
        const lng = record.longitude || record.location?.coordinates?.[0];
        const lat = record.latitude || record.location?.coordinates?.[1];
        if (lng && lat) {
          return <span style={{ fontSize: 12, color: '#666' }}>{lng.toFixed(4)}, {lat.toFixed(4)}</span>;
        }
        return '-';
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (status: string) => (
        <Tag color={status === 'active' ? 'success' : 'default'}>
          {status === 'active' ? '启用' : '禁用'}
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      fixed: 'right' as const,
      render: (_: any, record: any) => (
        <Space size="small">
          <Button type="text" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)}>
            详情
          </Button>
          <Button type="text" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Popconfirm
            title="确认删除"
            description="删除后不可恢复，是否继续？"
            onConfirm={() => handleDelete(record.id || record._id)}
            okText="删除"
            cancelText="取消"
            okButtonProps={{ danger: true }}
          >
            <Button type="text" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      {/* 统计卡片 */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card>
            <Statistic title="彩蛋总数" value={stats?.total || 0} prefix={<TrophyOutlined />} />
          </Card>
        </Col>
        <Col span={18}>
          <Card>
            <Row gutter={16}>
              <Col span={6}>
                <Statistic
                  title="传说"
                  value={stats?.rarity_stats?.find((s: any) => s._id === 'legendary')?.count || 0}
                  valueStyle={{ color: '#faad14' }}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="史诗"
                  value={stats?.rarity_stats?.find((s: any) => s._id === 'epic')?.count || 0}
                  valueStyle={{ color: '#722ed1' }}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="稀有"
                  value={stats?.rarity_stats?.find((s: any) => s._id === 'rare')?.count || 0}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="普通"
                  value={stats?.rarity_stats?.find((s: any) => s._id === 'common')?.count || 0}
                />
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>

      <Card style={{ marginBottom: 16 }}>
        <Space wrap style={{ marginBottom: 16 }}>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            新增彩蛋
          </Button>
        </Space>

        <Space wrap>
          <Input
            placeholder="搜索彩蛋名称"
            prefix={<SearchOutlined />}
            value={filters.keyword}
            onChange={(e) => setFilters({ ...filters, keyword: e.target.value })}
            style={{ width: 200 }}
            allowClear
          />
          <Select
            placeholder="类型"
            value={filters.type || undefined}
            onChange={(value) => setFilters({ ...filters, type: value })}
            style={{ width: 120 }}
            allowClear
          >
            <Option value="checkin">打卡彩蛋</Option>
            <Option value="bond">羁绊彩蛋</Option>
            <Option value="collection">收集彩蛋</Option>
            <Option value="special">特殊彩蛋</Option>
          </Select>
          <Select
            placeholder="稀有度"
            value={filters.rarity || undefined}
            onChange={(value) => setFilters({ ...filters, rarity: value })}
            style={{ width: 120 }}
            allowClear
          >
            <Option value="legendary">传说</Option>
            <Option value="epic">史诗</Option>
            <Option value="rare">稀有</Option>
            <Option value="common">普通</Option>
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
          columns={columns}
          dataSource={data}
          rowKey={(record) => record.id || record._id}
          loading={loading}
          scroll={{ x: 1000 }}
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
        />
      </Card>

      {/* 编辑/创建弹窗 */}
      <Modal
        title={editingEgg ? '编辑彩蛋' : '新增彩蛋'}
        open={isModalOpen}
        onOk={handleSave}
        onCancel={() => setIsModalOpen(false)}
        width={700}
        destroyOnClose
      >
        <Form form={form} layout="vertical" style={{ marginTop: 24 }}>
          <Form.Item
            name="name"
            label="彩蛋名称"
            rules={[{ required: true, message: '请输入彩蛋名称' }]}
          >
            <Input placeholder="如：AG超玩会羁绊" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="type"
                label="类型"
                rules={[{ required: true }]}
                initialValue="checkin"
              >
                <Select>
                  <Option value="checkin">打卡彩蛋</Option>
                  <Option value="bond">羁绊彩蛋</Option>
                  <Option value="collection">收集彩蛋</Option>
                  <Option value="special">特殊彩蛋</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="rarity"
                label="稀有度"
                rules={[{ required: true }]}
                initialValue="common"
              >
                <Select>
                  <Option value="legendary">传说</Option>
                  <Option value="epic">史诗</Option>
                  <Option value="rare">稀有</Option>
                  <Option value="common">普通</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="triggerCondition" label="触发条件">
            <Input placeholder="触发条件描述" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="longitude" label="经度" rules={[{ required: true, message: '请输入经度' }]}>
                <Input type="number" step="0.000001" placeholder="如：104.0625" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="latitude" label="纬度" rules={[{ required: true, message: '请输入纬度' }]}>
                <Input type="number" step="0.000001" placeholder="如：30.6667" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="description" label="彩蛋描述">
            <Input.TextArea rows={3} placeholder="彩蛋内容介绍" />
          </Form.Item>

          <Form.Item name="reward" label="奖励内容">
            <Input.TextArea rows={2} placeholder="获得的奖励" />
          </Form.Item>

          <Form.Item name="status" label="状态" initialValue="active">
            <Select>
              <Option value="active">启用</Option>
              <Option value="inactive">禁用</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      {/* 详情弹窗 */}
      <Modal
        title="彩蛋详情"
        open={isDetailModalOpen}
        onCancel={() => setIsDetailModalOpen(false)}
        footer={null}
        width={600}
      >
        {viewingEgg && (
          <Descriptions bordered column={1}>
            <Descriptions.Item label="彩蛋名称">{viewingEgg.name}</Descriptions.Item>
            <Descriptions.Item label="类型">
              {viewingEgg.type === 'checkin'
                ? '打卡彩蛋'
                : viewingEgg.type === 'bond'
                ? '羁绊彩蛋'
                : viewingEgg.type === 'collection'
                ? '收集彩蛋'
                : '特殊彩蛋'}
            </Descriptions.Item>
            <Descriptions.Item label="稀有度">
              {getRarityTag(viewingEgg.rarity)}
            </Descriptions.Item>
            <Descriptions.Item label="触发条件">
              {viewingEgg.triggerCondition || viewingEgg.trigger || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="描述">{viewingEgg.description || '-'}</Descriptions.Item>
            <Descriptions.Item label="奖励">{viewingEgg.reward || '-'}</Descriptions.Item>
            <Descriptions.Item label="状态">
              <Tag color={viewingEgg.status === 'active' ? 'success' : 'default'}>
                {viewingEgg.status === 'active' ? '启用' : '禁用'}
              </Tag>
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  );
};

export default EasterEggManagement;
