import React, { useEffect, useState } from 'react';
import {
  Card,
  Button,
  Table,
  Avatar,
  Tag,
  Space,
  Input,
  Select,
  message,
  Modal,
  Descriptions,
  Statistic,
  Row,
  Col,
  Tabs,
} from 'antd';
import {
  SearchOutlined,
  EyeOutlined,
  GiftOutlined,
  StopOutlined,
  CheckCircleOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { userApi } from '../../api/user';
import type { AppUser } from '../../types';

const { Option } = Select;

const UserManagement: React.FC = () => {
  const [data, setData] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [filters, setFilters] = useState({
    keyword: '',
    status: '',
    heroId: '',
  });
  const [stats, setStats] = useState<any>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [viewingUser, setViewingUser] = useState<AppUser | null>(null);
  const [userCoupons, setUserCoupons] = useState<any[]>([]);
  const [userCheckins, setUserCheckins] = useState<any[]>([]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await userApi.getList({
        page,
        pageSize,
        ...filters,
      });
      // 转换 snake_case 到 camelCase
      const normalizedList = res.list.map((item: any) => ({
        ...item,
        id: item.id || item._id,
        currentHeroId: item.currentHeroId || item.current_hero_id,
        heroBonds: item.heroBonds || item.hero_bonds,
        totalSteps: item.totalSteps || item.total_steps,
        totalDistance: item.totalDistance || item.total_distance,
        createdAt: item.createdAt || item.created_at,
        lastLoginAt: item.lastLoginAt || item.last_login_at,
      }));
      setData(normalizedList);
      setTotal(res.total);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await userApi.getStats();
      setStats(res);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchData();
    fetchStats();
  }, [page, pageSize, filters]);

  const handleBan = async (id: string) => {
    try {
      await userApi.ban(id, { reason: '违规操作' });
      message.success('封禁成功');
      fetchData();
    } catch (error) {
      message.error('封禁失败');
    }
  };

  const handleUnban = async (id: string) => {
    try {
      await userApi.unban(id);
      message.success('解封成功');
      fetchData();
    } catch (error) {
      message.error('解封失败');
    }
  };

  const handleViewDetail = async (record: AppUser) => {
    setViewingUser(record);
    setIsDetailModalOpen(true);
    try {
      const coupons = await userApi.getUserCoupons(record.id);
      setUserCoupons(coupons);
    } catch {
      setUserCoupons([]);
    }
    try {
      const checkins = await userApi.getUserCheckins(record.id);
      setUserCheckins(checkins);
    } catch {
      setUserCheckins([]);
    }
  };

  const getHeroName = (heroId: string) => {
    const heroMap: Record<string, string> = {
      li_bai: '李白',
      zhugeliang: '诸葛亮',
      luban: '鲁班',
    };
    return heroMap[heroId] || heroId;
  };

  const columns = [
    {
      title: '头像',
      dataIndex: 'avatar',
      width: 80,
      render: (avatar: string) => (
        <Avatar src={avatar} icon={!avatar && <UserOutlined />} size="large" />
      ),
    },
    { title: '昵称', dataIndex: 'nickname', width: 150 },
    {
      title: '当前英雄',
      dataIndex: 'currentHeroId',
      width: 120,
      render: (heroId: string) => getHeroName(heroId),
    },
    {
      title: '羁绊值',
      dataIndex: 'heroBonds',
      width: 100,
      render: (bonds: Record<string, any>) => {
        const total = Object.values(bonds || {}).reduce(
          (sum: number, b: any) => sum + (b.bondValue || 0),
          0
        );
        return total;
      },
    },
    {
      title: '总步数',
      dataIndex: 'totalSteps',
      width: 120,
      render: (steps: number) => steps?.toLocaleString() || 0,
    },
    {
      title: '注册时间',
      dataIndex: 'createdAt',
      width: 180,
      render: (date: string) => new Date(date).toLocaleString(),
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (status: string) => (
        <Tag color={status === 'active' ? 'success' : status === 'banned' ? 'error' : 'default'}>
          {status === 'active' ? '正常' : status === 'banned' ? '已封禁' : '未知'}
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 220,
      fixed: 'right',
      render: (_: any, record: AppUser) => (
        <Space size="small">
          <Button type="text" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)}>
            详情
          </Button>
          <Button type="text" icon={<GiftOutlined />}>
            发券
          </Button>
          {record.status === 'banned' ? (
            <Button type="text" icon={<CheckCircleOutlined />} onClick={() => handleUnban(record.id)}>
              解封
            </Button>
          ) : (
            <Button type="text" danger icon={<StopOutlined />} onClick={() => handleBan(record.id)}>
              封禁
            </Button>
          )}
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
            <Statistic title="总用户数" value={stats?.total || 0} prefix={<UserOutlined />} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="今日新增"
              value={stats?.today_new || 0}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="活跃用户(7天)"
              value={stats?.active || 0}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="封禁用户"
              value={stats?.banned || 0}
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
      </Row>

      <Card style={{ marginBottom: 16 }}>
        <Space wrap>
          <Input
            placeholder="搜索昵称"
            prefix={<SearchOutlined />}
            value={filters.keyword}
            onChange={(e) => setFilters({ ...filters, keyword: e.target.value })}
            style={{ width: 200 }}
            allowClear
          />
          <Select
            placeholder="当前英雄"
            value={filters.heroId || undefined}
            onChange={(value) => setFilters({ ...filters, heroId: value })}
            style={{ width: 120 }}
            allowClear
          >
            <Option value="li_bai">李白</Option>
            <Option value="zhugeliang">诸葛亮</Option>
            <Option value="luban">鲁班</Option>
          </Select>
          <Select
            placeholder="状态"
            value={filters.status || undefined}
            onChange={(value) => setFilters({ ...filters, status: value })}
            style={{ width: 120 }}
            allowClear
          >
            <Option value="active">正常</Option>
            <Option value="banned">已封禁</Option>
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

      {/* 用户详情弹窗 */}
      <Modal
        title="用户详情"
        open={isDetailModalOpen}
        onCancel={() => setIsDetailModalOpen(false)}
        footer={null}
        width={800}
      >
        {viewingUser && (
          <Tabs
            defaultActiveKey="info"
            items={[
              {
                key: 'info',
                label: '基本信息',
                children: (
                  <>
                    <Descriptions bordered column={2}>
                      <Descriptions.Item label="用户ID">{viewingUser.id}</Descriptions.Item>
                      <Descriptions.Item label="昵称">{viewingUser.nickname}</Descriptions.Item>
                      <Descriptions.Item label="当前英雄">
                        {getHeroName(viewingUser.currentHeroId)}
                      </Descriptions.Item>
                      <Descriptions.Item label="当前城市">{viewingUser.currentCity}</Descriptions.Item>
                      <Descriptions.Item label="总步数">
                        {viewingUser.totalSteps?.toLocaleString()}
                      </Descriptions.Item>
                      <Descriptions.Item label="总距离">
                        {(viewingUser.totalDistance / 1000).toFixed(2)} km
                      </Descriptions.Item>
                      <Descriptions.Item label="注册时间">
                        {new Date(viewingUser.createdAt).toLocaleString()}
                      </Descriptions.Item>
                      <Descriptions.Item label="最后登录">
                        {new Date(viewingUser.lastLoginAt).toLocaleString()}
                      </Descriptions.Item>
                    </Descriptions>

                    <h4 style={{ marginTop: 24 }}>英雄羁绊</h4>
                    {Object.entries(viewingUser.heroBonds || {}).map(([heroId, bond]: [string, any]) => (
                      <Tag key={heroId} color="blue" style={{ marginRight: 8 }}>
                        {getHeroName(heroId)}: Lv{bond.bondLevel} ({bond.bondValue})
                      </Tag>
                    ))}

                    <h4 style={{ marginTop: 16 }}>已获得勋章</h4>
                    {(viewingUser.badges || []).map((badge: string) => (
                      <Tag key={badge} color="gold">
                        {badge}
                      </Tag>
                    ))}
                  </>
                ),
              },
              {
                key: 'coupons',
                label: `优惠券 (${userCoupons.length})`,
                children: userCoupons.length > 0 ? (
                  <ul>
                    {userCoupons.map((coupon: any, idx: number) => (
                      <li key={idx}>
                        {coupon.name} -{' '}
                        <Tag color={coupon.status === 'unused' ? 'green' : 'default'}>
                          {coupon.status === 'unused' ? '未使用' : '已使用'}
                        </Tag>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p style={{ color: '#999' }}>暂无优惠券</p>
                ),
              },
              {
                key: 'checkins',
                label: `打卡记录 (${userCheckins.length})`,
                children: userCheckins.length > 0 ? (
                  <ul>
                    {userCheckins.map((checkin: any, idx: number) => (
                      <li key={idx}>
                        {new Date(checkin.created_at).toLocaleString()} - {checkin.poi_name}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p style={{ color: '#999' }}>暂无打卡记录</p>
                ),
              },
            ]}
          />
        )}
      </Modal>
    </div>
  );
};

export default UserManagement;
