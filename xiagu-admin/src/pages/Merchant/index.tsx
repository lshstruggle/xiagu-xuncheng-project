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
  Image,
  Descriptions,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  EyeOutlined,
  EnvironmentOutlined,
} from '@ant-design/icons';
import { merchantApi } from '../../api/merchant';
import type { Merchant } from '../../types';

const { Option } = Select;

const MerchantManagement: React.FC = () => {
  const [data, setData] = useState<Merchant[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [filters, setFilters] = useState({
    keyword: '',
    category: '',
    status: '',
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [editingMerchant, setEditingMerchant] = useState<Merchant | null>(null);
  const [viewingMerchant, setViewingMerchant] = useState<Merchant | null>(null);
  const [relatedPois, setRelatedPois] = useState<any[]>([]);
  const [form] = Form.useForm();

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await merchantApi.getList({
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

  useEffect(() => {
    fetchData();
  }, [page, pageSize, filters]);

  const handleDelete = async (id: string) => {
    try {
      await merchantApi.delete(id);
      message.success('删除成功');
      fetchData();
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handleViewDetail = async (record: Merchant) => {
    setViewingMerchant(record);
    setIsDetailModalOpen(true);
    try {
      const pois = await merchantApi.getRelatedPois(record.id);
      setRelatedPois(pois);
    } catch {
      setRelatedPois([]);
    }
  };

  const handleEdit = (record: Merchant) => {
    setEditingMerchant(record);
    form.setFieldsValue(record);
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setEditingMerchant(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      if (editingMerchant) {
        await merchantApi.update(editingMerchant.id, values);
        message.success('更新成功');
      } else {
        await merchantApi.create(values);
        message.success('创建成功');
      }
      setIsModalOpen(false);
      fetchData();
    } catch (error) {
      message.error('保存失败');
    }
  };

  const columns = [
    {
      title: '商户Logo',
      dataIndex: 'logo',
      width: 100,
      render: (logo: string) =>
        logo ? <Image src={logo} width={60} height={60} style={{ objectFit: 'cover' }} /> : '-',
    },
    { title: '商户名称', dataIndex: 'name', width: 150 },
    { title: '分类', dataIndex: 'category', width: 120 },
    { title: '联系人', dataIndex: 'contact', width: 100 },
    { title: '电话', dataIndex: 'phone', width: 130 },
    {
      title: '地址',
      dataIndex: 'address',
      ellipsis: true,
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (status: string) => (
        <Tag color={status === 'active' ? 'success' : 'default'}>
          {status === 'active' ? '营业中' : '暂停营业'}
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      fixed: 'right' as const,
      render: (_: any, record: Merchant) => (
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

  const categoryOptions = [
    { value: '餐饮', label: '餐饮' },
    { value: '住宿', label: '住宿' },
    { value: '文创', label: '文创' },
    { value: '娱乐', label: '娱乐' },
    { value: '购物', label: '购物' },
  ];

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <Space wrap style={{ marginBottom: 16 }}>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            新增商户
          </Button>
        </Space>

        <Space wrap>
          <Input
            placeholder="搜索商户名称/联系人/电话"
            prefix={<SearchOutlined />}
            value={filters.keyword}
            onChange={(e) => setFilters({ ...filters, keyword: e.target.value })}
            style={{ width: 250 }}
            allowClear
          />
          <Select
            placeholder="分类"
            value={filters.category || undefined}
            onChange={(value) => setFilters({ ...filters, category: value })}
            style={{ width: 120 }}
            allowClear
          >
            {categoryOptions.map((opt) => (
              <Option key={opt.value} value={opt.value}>
                {opt.label}
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
            <Option value="active">营业中</Option>
            <Option value="inactive">暂停营业</Option>
          </Select>
        </Space>
      </Card>

      <Card>
        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={loading}
          scroll={{ x: 1200 }}
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
        title={editingMerchant ? '编辑商户' : '新增商户'}
        open={isModalOpen}
        onOk={handleSave}
        onCancel={() => setIsModalOpen(false)}
        width={600}
        destroyOnClose
      >
        <Form form={form} layout="vertical" style={{ marginTop: 24 }}>
          <Form.Item
            name="name"
            label="商户名称"
            rules={[{ required: true, message: '请输入商户名称' }]}
          >
            <Input placeholder="如：明婷饭店" />
          </Form.Item>
          <Form.Item
            name="category"
            label="分类"
            rules={[{ required: true, message: '请选择分类' }]}
          >
            <Select placeholder="选择分类">
              {categoryOptions.map((opt) => (
                <Option key={opt.value} value={opt.value}>
                  {opt.label}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="logo" label="Logo图片URL">
            <Input placeholder="https://..." />
          </Form.Item>
          <Form.Item name="contact" label="联系人">
            <Input placeholder="联系人姓名" />
          </Form.Item>
          <Form.Item name="phone" label="联系电话">
            <Input placeholder="138xxxx..." />
          </Form.Item>
          <Form.Item name="address" label="详细地址">
            <Input.TextArea rows={2} placeholder="详细地址" />
          </Form.Item>
          <Form.Item name="openTime" label="营业时间">
            <Input placeholder="如：09:00-22:00" />
          </Form.Item>
          <Form.Item name="description" label="商户简介">
            <Input.TextArea rows={3} placeholder="商户简介描述" />
          </Form.Item>
          <Form.Item name="status" label="状态" initialValue="active">
            <Select>
              <Option value="active">营业中</Option>
              <Option value="inactive">暂停营业</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      {/* 详情弹窗 */}
      <Modal
        title="商户详情"
        open={isDetailModalOpen}
        onCancel={() => setIsDetailModalOpen(false)}
        footer={null}
        width={700}
      >
        {viewingMerchant && (
          <>
            <Descriptions bordered column={2} style={{ marginBottom: 24 }}>
              <Descriptions.Item label="商户名称">{viewingMerchant.name}</Descriptions.Item>
              <Descriptions.Item label="分类">{viewingMerchant.category}</Descriptions.Item>
              <Descriptions.Item label="联系人">{viewingMerchant.contact}</Descriptions.Item>
              <Descriptions.Item label="电话">{viewingMerchant.phone}</Descriptions.Item>
              <Descriptions.Item label="营业时间">{viewingMerchant.openTime || '-'}</Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={viewingMerchant.status === 'active' ? 'success' : 'default'}>
                  {viewingMerchant.status === 'active' ? '营业中' : '暂停营业'}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="地址" span={2}>
                {viewingMerchant.address}
              </Descriptions.Item>
              <Descriptions.Item label="简介" span={2}>
                {viewingMerchant.description || '-'}
              </Descriptions.Item>
            </Descriptions>

            <h4>
              <EnvironmentOutlined style={{ marginRight: 8 }} />
              关联POI
            </h4>
            {relatedPois.length > 0 ? (
              <ul>
                {relatedPois.map((poi) => (
                  <li key={poi.id}>
                    {poi.name} ({poi.type})
                  </li>
                ))}
              </ul>
            ) : (
              <p style={{ color: '#999' }}>暂无关联POI</p>
            )}
          </>
        )}
      </Modal>
    </div>
  );
};

export default MerchantManagement;
