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
  InputNumber,
  Radio,
  Statistic,
  Row,
  Col,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  GiftOutlined,
  SearchOutlined,
  UserAddOutlined,
} from '@ant-design/icons';
import { couponApi } from '../../api/coupon';
import type { CouponDefinition } from '../../types';

const { Option } = Select;

const CouponManagement: React.FC = () => {
  const [data, setData] = useState<CouponDefinition[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [filters, setFilters] = useState({
    keyword: '',
    type: '',
    subType: '',
    status: '',
  });
  const [stats, setStats] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<CouponDefinition | null>(null);
  const [issuingCouponId, setIssuingCouponId] = useState<string>('');
  const [form] = Form.useForm();
  const [issueForm] = Form.useForm();

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await couponApi.getList({
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

  const fetchStats = async () => {
    try {
      const res = await couponApi.getStats();
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
      await couponApi.delete(id);
      message.success('删除成功');
      fetchData();
      fetchStats();
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handleEdit = (record: CouponDefinition) => {
    setEditingCoupon(record);
    form.setFieldsValue(record);
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setEditingCoupon(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      if (editingCoupon) {
        await couponApi.update(editingCoupon.id, values);
        message.success('更新成功');
      } else {
        await couponApi.create(values);
        message.success('创建成功');
      }
      setIsModalOpen(false);
      fetchData();
      fetchStats();
    } catch (error) {
      message.error('保存失败');
    }
  };

  const handleIssue = (record: CouponDefinition) => {
    setIssuingCouponId(record.id);
    issueForm.resetFields();
    setIsIssueModalOpen(true);
  };

  const handleIssueSubmit = async () => {
    try {
      const values = await issueForm.validateFields();
      await couponApi.issueToUser(issuingCouponId, values);
      message.success('发放成功');
      setIsIssueModalOpen(false);
      fetchStats();
    } catch (error) {
      message.error('发放失败');
    }
  };

  const getTypeTag = (type: string, subType: string) => {
    const typeMap: Record<string, { color: string; text: string }> = {
      coupon: { color: 'blue', text: '优惠券' },
      exchange: { color: 'green', text: '兑换券' },
      experience: { color: 'purple', text: '体验券' },
    };
    const subTypeMap: Record<string, string> = {
      red: '红Buff',
      blue: '蓝Buff',
      hotel: '泉水',
      esports: '电竞',
    };
    const typeInfo = typeMap[type] || { color: 'default', text: type };
    return (
      <Space>
        <Tag color={typeInfo.color}>{typeInfo.text}</Tag>
        {subType && <Tag>{subTypeMap[subType] || subType}</Tag>}
      </Space>
    );
  };

  const columns = [
    { title: '券名称', dataIndex: 'name', width: 180 },
    {
      title: '类型',
      width: 150,
      render: (_: any, record: CouponDefinition) => getTypeTag(record.type, record.subType),
    },
    {
      title: '优惠内容',
      width: 200,
      render: (_: any, record: CouponDefinition) => {
        // 直接显示描述信息
        return <span>{record.description || '-'}</span>;
      },
    },
    { title: '有效期', dataIndex: 'validDays', width: 100, render: (v: number) => `${v}天` },
    {
      title: '发放/使用',
      width: 120,
      render: (_: any, record: CouponDefinition) => (
        <span>
          {record.issuedCount || 0} / {record.usedCount || 0}
        </span>
      ),
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
      width: 220,
      fixed: 'right' as const,
      render: (_: any, record: CouponDefinition) => (
        <Space size="small">
          <Button type="text" icon={<UserAddOutlined />} onClick={() => handleIssue(record)}>
            发放
          </Button>
          <Button type="text" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Popconfirm
            title="确认删除"
            description="删除后不可恢复，是否继续？"
            onConfirm={() => handleDelete(record.id)}
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
            <Statistic title="优惠券总数" value={stats?.total || 0} prefix={<GiftOutlined />} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="启用中" value={stats?.active || 0} valueStyle={{ color: '#3f8600' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="已发放" value={stats?.total_issued || 0} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="已使用" value={stats?.total_used || 0} />
          </Card>
        </Col>
      </Row>

      <Card style={{ marginBottom: 16 }}>
        <Space wrap style={{ marginBottom: 16 }}>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            新增优惠券
          </Button>
        </Space>

        <Space wrap>
          <Input
            placeholder="搜索券名称"
            prefix={<SearchOutlined />}
            value={filters.keyword}
            onChange={(e) => setFilters({ ...filters, keyword: e.target.value })}
            style={{ width: 200 }}
            allowClear
          />
          <Select
            placeholder="券类型"
            value={filters.type || undefined}
            onChange={(value) => setFilters({ ...filters, type: value })}
            style={{ width: 120 }}
            allowClear
          >
            <Option value="coupon">优惠券</Option>
            <Option value="exchange">兑换券</Option>
            <Option value="experience">体验券</Option>
          </Select>
          <Select
            placeholder="子类型"
            value={filters.subType || undefined}
            onChange={(value) => setFilters({ ...filters, subType: value })}
            style={{ width: 120 }}
            allowClear
          >
            <Option value="red">红Buff</Option>
            <Option value="blue">蓝Buff</Option>
            <Option value="hotel">泉水</Option>
            <Option value="esports">电竞</Option>
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
          rowKey="id"
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
        title={editingCoupon ? '编辑优惠券' : '新增优惠券'}
        open={isModalOpen}
        onOk={handleSave}
        onCancel={() => setIsModalOpen(false)}
        width={700}
        destroyOnClose
      >
        <Form form={form} layout="vertical" style={{ marginTop: 24 }}>
          <Form.Item
            name="name"
            label="券名称"
            rules={[{ required: true, message: '请输入券名称' }]}
          >
            <Input placeholder="如：武侯祠门票8折券" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="type"
                label="券类型"
                rules={[{ required: true }]}
                initialValue="coupon"
              >
                <Select>
                  <Option value="coupon">优惠券</Option>
                  <Option value="exchange">兑换券</Option>
                  <Option value="experience">体验券</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="subType"
                label="子类型"
                rules={[{ required: true }]}
                initialValue="red"
              >
                <Select>
                  <Option value="red">红Buff（美食）</Option>
                  <Option value="blue">蓝Buff（文化）</Option>
                  <Option value="hotel">泉水（住宿）</Option>
                  <Option value="esports">电竞</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="discountType" label="优惠方式" initialValue="discount">
            <Radio.Group>
              <Radio.Button value="discount">折扣</Radio.Button>
              <Radio.Button value="amount">满减</Radio.Button>
              <Radio.Button value="exchange">兑换</Radio.Button>
            </Radio.Group>
          </Form.Item>

          <Form.Item
            name="discountValue"
            label="优惠值"
            rules={[{ required: true }]}
          >
            <Input placeholder="如：9折、20元、免费兑换" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="validDays" label="有效期（天）" initialValue={30}>
                <InputNumber min={1} max={365} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="usageLimit" label="每人限领" initialValue={1}>
                <InputNumber min={1} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="totalLimit" label="总发放数量">
            <InputNumber min={0} placeholder="0表示不限" style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item name="description" label="使用说明">
            <Input.TextArea rows={3} placeholder="使用规则说明" />
          </Form.Item>

          <Form.Item name="status" label="状态" initialValue="active">
            <Select>
              <Option value="active">启用</Option>
              <Option value="inactive">禁用</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      {/* 发放弹窗 */}
      <Modal
        title="发放优惠券"
        open={isIssueModalOpen}
        onOk={handleIssueSubmit}
        onCancel={() => setIsIssueModalOpen(false)}
        destroyOnClose
      >
        <Form form={issueForm} layout="vertical" style={{ marginTop: 24 }}>
          <Form.Item
            name="userId"
            label="用户ID"
            rules={[{ required: true, message: '请输入用户ID' }]}
          >
            <Input placeholder="用户ID" />
          </Form.Item>
          <Form.Item
            name="count"
            label="发放数量"
            rules={[{ required: true }]}
            initialValue={1}
          >
            <InputNumber min={1} max={10} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default CouponManagement;
