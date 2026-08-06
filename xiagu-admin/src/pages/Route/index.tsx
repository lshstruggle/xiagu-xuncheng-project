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
  Transfer,
  Row,
  Col,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  SwapOutlined,
} from '@ant-design/icons';
import { routeApi } from '../../api/route';
import { poiApi } from '../../api/poi';
import type { Route } from '../../types';

const { Option } = Select;

const RouteManagement: React.FC = () => {
  const [data, setData] = useState<Route[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [filters, setFilters] = useState({
    keyword: '',
    cityCode: '',
    difficulty: '',
    status: '',
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSortModalOpen, setIsSortModalOpen] = useState(false);
  const [editingRoute, setEditingRoute] = useState<Route | null>(null);
  const [sortingRoute, setSortingRoute] = useState<Route | null>(null);
  const [poiList, setPoiList] = useState<any[]>([]);
  const [selectedPois, setSelectedPois] = useState<string[]>([]);
  const [form] = Form.useForm();

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await routeApi.getList({
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

  const fetchPOIs = async () => {
    try {
      const res = await poiApi.getList({ page: 1, pageSize: 100 });
      setPoiList(
        res.list.map((poi: any) => ({
          key: poi.id,
          title: poi.name,
          description: poi.type,
        }))
      );
    } catch {
      setPoiList([]);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await routeApi.delete(id);
      message.success('删除成功');
      fetchData();
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handleEdit = (record: Route) => {
    setEditingRoute(record);
    form.setFieldsValue({
      ...record,
      poiSequence: record.poiSequence || [],
    });
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setEditingRoute(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      if (editingRoute) {
        await routeApi.update(editingRoute.id, values);
        message.success('更新成功');
      } else {
        await routeApi.create(values);
        message.success('创建成功');
      }
      setIsModalOpen(false);
      fetchData();
    } catch (error) {
      message.error('保存失败');
    }
  };

  const handleSort = async (record: Route) => {
    setSortingRoute(record);
    await fetchPOIs();
    setSelectedPois(record.poiSequence || []);
    setIsSortModalOpen(true);
  };

  const handleSortSave = async () => {
    if (!sortingRoute) return;
    try {
      await routeApi.updatePOISequence(sortingRoute.id, selectedPois);
      message.success('排序更新成功');
      setIsSortModalOpen(false);
      fetchData();
    } catch (error) {
      message.error('更新失败');
    }
  };

  const getDifficultyTag = (difficulty: string) => {
    const map: Record<string, { color: string; text: string }> = {
      easy: { color: 'green', text: '简单' },
      normal: { color: 'blue', text: '普通' },
      hard: { color: 'red', text: '困难' },
    };
    const info = map[difficulty] || { color: 'default', text: difficulty };
    return <Tag color={info.color}>{info.text}</Tag>;
  };

  const columns = [
    { title: '路线名称', dataIndex: 'name', width: 180 },
    {
      title: '城市',
      dataIndex: 'cityCode',
      width: 100,
      render: (code: string) => {
        const map: Record<string, string> = {
          CD: '成都',
          SH: '上海',
          BJ: '北京',
          HZ: '杭州',
        };
        return map[code] || code;
      },
    },
    { title: '时长', dataIndex: 'duration', width: 100 },
    {
      title: '难度',
      dataIndex: 'difficulty',
      width: 100,
      render: (d: string) => getDifficultyTag(d),
    },
    {
      title: '距离',
      dataIndex: 'distance',
      width: 100,
      render: (d: number) => (d ? `${d}km` : '-'),
    },
    {
      title: 'POI数量',
      dataIndex: 'poiSequence',
      width: 100,
      render: (seq: string[]) => seq?.length || 0,
    },
    {
      title: '标签',
      dataIndex: 'tags',
      render: (tags: string[]) => (
        <Space size="small">
          {tags?.map((tag) => (
            <Tag key={tag} size="small">
              {tag}
            </Tag>
          ))}
        </Space>
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
      render: (_: any, record: Route) => (
        <Space size="small">
          <Button type="text" icon={<SwapOutlined />} onClick={() => handleSort(record)}>
            POI排序
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
      <Card style={{ marginBottom: 16 }}>
        <Space wrap style={{ marginBottom: 16 }}>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            新增路线
          </Button>
        </Space>

        <Space wrap>
          <Input
            placeholder="搜索路线名称"
            prefix={<SearchOutlined />}
            value={filters.keyword}
            onChange={(e) => setFilters({ ...filters, keyword: e.target.value })}
            style={{ width: 200 }}
            allowClear
          />
          <Select
            placeholder="城市"
            value={filters.cityCode || undefined}
            onChange={(value) => setFilters({ ...filters, cityCode: value })}
            style={{ width: 120 }}
            allowClear
          >
            <Option value="CD">成都</Option>
            <Option value="SH">上海</Option>
            <Option value="BJ">北京</Option>
            <Option value="HZ">杭州</Option>
          </Select>
          <Select
            placeholder="难度"
            value={filters.difficulty || undefined}
            onChange={(value) => setFilters({ ...filters, difficulty: value })}
            style={{ width: 120 }}
            allowClear
          >
            <Option value="easy">简单</Option>
            <Option value="normal">普通</Option>
            <Option value="hard">困难</Option>
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
          scroll={{ x: 1100 }}
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
        title={editingRoute ? '编辑路线' : '新增路线'}
        open={isModalOpen}
        onOk={handleSave}
        onCancel={() => setIsModalOpen(false)}
        width={700}
        destroyOnClose
      >
        <Form form={form} layout="vertical" style={{ marginTop: 24 }}>
          <Form.Item
            name="name"
            label="路线名称"
            rules={[{ required: true, message: '请输入路线名称' }]}
          >
            <Input placeholder="如：成都文化一日游" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="cityCode"
                label="城市"
                rules={[{ required: true }]}
              >
                <Select placeholder="选择城市">
                  <Option value="CD">成都</Option>
                  <Option value="SH">上海</Option>
                  <Option value="BJ">北京</Option>
                  <Option value="HZ">杭州</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="difficulty"
                label="难度"
                rules={[{ required: true }]}
                initialValue="normal"
              >
                <Select>
                  <Option value="easy">简单</Option>
                  <Option value="normal">普通</Option>
                  <Option value="hard">困难</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="duration" label="预计时长">
                <Input placeholder="如：3-4小时" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="distance" label="距离(km)">
                <InputNumber min={0} step={0.1} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="description" label="路线描述">
            <Input.TextArea rows={3} placeholder="路线介绍" />
          </Form.Item>

          <Form.Item name="tags" label="标签">
            <Select mode="tags" placeholder="输入标签后回车">
              <Option value="文化">文化</Option>
              <Option value="美食">美食</Option>
              <Option value="历史">历史</Option>
              <Option value="电竞">电竞</Option>
            </Select>
          </Form.Item>

          <Form.Item name="status" label="状态" initialValue="active">
            <Select>
              <Option value="active">启用</Option>
              <Option value="inactive">禁用</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      {/* POI排序弹窗 */}
      <Modal
        title={`${sortingRoute?.name} - POI排序`}
        open={isSortModalOpen}
        onOk={handleSortSave}
        onCancel={() => setIsSortModalOpen(false)}
        width={700}
      >
        <p style={{ marginBottom: 16, color: '#666' }}>
          从左侧选择POI添加到路线，右侧可调整顺序
        </p>
        <Transfer
          dataSource={poiList}
          titles={['可选POI', '已选POI（拖拽排序）']}
          targetKeys={selectedPois}
          onChange={setSelectedPois}
          render={(item) => item.title}
          listStyle={{
            width: 300,
            height: 400,
          }}
        />
      </Modal>
    </div>
  );
};

export default RouteManagement;
