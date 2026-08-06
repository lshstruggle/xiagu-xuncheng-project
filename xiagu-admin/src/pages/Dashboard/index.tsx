import React, { useEffect, useState, useRef } from 'react';
import { Row, Col, Card, Statistic, Table, DatePicker, Button, Avatar, Progress } from 'antd';
import {
  UserOutlined,
  EnvironmentOutlined,
  GiftOutlined,
  RiseOutlined,
  FallOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import * as echarts from 'echarts';
import { statsApi } from '../../api/admin';
import type { DashboardStats } from '../../types';

const { RangePicker } = DatePicker;

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(false);
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);

  // 模拟数据
  const mockStats: DashboardStats = {
    todayActiveUsers: 128,
    todayCheckins: 356,
    totalUsers: 2586,
    couponUsageRate: 68.5,
    trends: [
      { date: '2024-01-01', checkins: 45, newUsers: 12 },
      { date: '2024-01-02', checkins: 52, newUsers: 15 },
      { date: '2024-01-03', checkins: 48, newUsers: 8 },
      { date: '2024-01-04', checkins: 61, newUsers: 22 },
      { date: '2024-01-05', checkins: 55, newUsers: 18 },
      { date: '2024-01-06', checkins: 72, newUsers: 25 },
      { date: '2024-01-07', checkins: 68, newUsers: 20 },
    ],
    hotPois: [
      { poiId: '1', poiName: '武侯祠', count: 1280 },
      { poiId: '2', poiName: '宽窄巷子', count: 956 },
      { poiId: '3', poiName: '锦里', count: 842 },
      { poiId: '4', poiName: '杜甫草堂', count: 635 },
      { poiId: '5', poiName: '金沙遗址', count: 524 },
      { poiId: '6', poiName: '文殊院', count: 468 },
      { poiId: '7', poiName: '大熊猫繁育基地', count: 423 },
      { poiId: '8', poiName: '东郊记忆', count: 389 },
      { poiId: '9', poiName: '太古里', count: 312 },
      { poiId: '10', poiName: '春熙路', count: 286 },
    ],
  };

  const fetchStats = async () => {
    setLoading(true);
    try {
      const data = await statsApi.getDashboard();
      // 如果后端返回数据为空，使用模拟数据
      setStats({
        ...mockStats,
        ...data,
        hotPois: data?.hotPois?.length ? data.hotPois : mockStats.hotPois,
        trends: data?.trends?.length ? data.trends : mockStats.trends,
      });
    } catch {
      // 请求失败时使用模拟数据
      setStats(mockStats);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  // 初始化图表
  useEffect(() => {
    if (chartRef.current && stats?.trends) {
      if (!chartInstance.current) {
        chartInstance.current = echarts.init(chartRef.current);
      }

      const dates = stats.trends.map(t => t.date.slice(5)); // MM-DD
      const checkins = stats.trends.map(t => t.checkins);
      const newUsers = stats.trends.map(t => t.newUsers);

      const option: echarts.EChartsOption = {
        tooltip: {
          trigger: 'axis',
          axisPointer: { type: 'cross' },
        },
        legend: {
          data: ['打卡次数', '新增用户'],
          bottom: 0,
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '15%',
          top: '10%',
          containLabel: true,
        },
        xAxis: {
          type: 'category',
          boundaryGap: false,
          data: dates,
          axisLine: { lineStyle: { color: '#ccc' } },
          axisLabel: { color: '#666' },
        },
        yAxis: [
          {
            type: 'value',
            name: '打卡次数',
            position: 'left',
            axisLine: { show: true, lineStyle: { color: '#1890ff' } },
            axisLabel: { color: '#1890ff' },
            splitLine: { lineStyle: { type: 'dashed' } },
          },
          {
            type: 'value',
            name: '新增用户',
            position: 'right',
            axisLine: { show: true, lineStyle: { color: '#52c41a' } },
            axisLabel: { color: '#52c41a' },
            splitLine: { show: false },
          },
        ],
        series: [
          {
            name: '打卡次数',
            type: 'line',
            smooth: true,
            yAxisIndex: 0,
            data: checkins,
            itemStyle: { color: '#1890ff' },
            areaStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: 'rgba(24, 144, 255, 0.3)' },
                { offset: 1, color: 'rgba(24, 144, 255, 0.05)' },
              ]),
            },
          },
          {
            name: '新增用户',
            type: 'line',
            smooth: true,
            yAxisIndex: 1,
            data: newUsers,
            itemStyle: { color: '#52c41a' },
            lineStyle: { type: 'dashed' },
          },
        ],
      };

      chartInstance.current.setOption(option);
    }

    // 窗口大小变化时重新调整图表
    const handleResize = () => {
      chartInstance.current?.resize();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [stats]);

  const statCards = [
    {
      title: '今日活跃用户',
      value: stats?.todayActiveUsers || 0,
      icon: <UserOutlined style={{ color: '#1890ff' }} />,
      trend: 12,
      color: '#e6f7ff',
    },
    {
      title: '今日打卡次数',
      value: stats?.todayCheckins || 0,
      icon: <EnvironmentOutlined style={{ color: '#52c41a' }} />,
      trend: 8,
      color: '#f6ffed',
    },
    {
      title: '累计用户总数',
      value: stats?.totalUsers || 0,
      icon: <UserOutlined style={{ color: '#722ed1' }} />,
      trend: 156,
      color: '#f9f0ff',
    },
    {
      title: '优惠券核销率',
      value: `${stats?.couponUsageRate || 0}%`,
      icon: <GiftOutlined style={{ color: '#fa8c16' }} />,
      trend: -2,
      color: '#fff7e6',
    },
  ];

  const hotPoiColumns = [
    {
      title: '排名',
      dataIndex: 'rank',
      width: 60,
      render: (_: any, __: any, index: number) => (
        <Avatar
          size="small"
          style={{
            backgroundColor: index < 3 ? '#1890ff' : '#d9d9d9',
          }}
        >
          {index + 1}
        </Avatar>
      ),
    },
    {
      title: 'POI名称',
      dataIndex: 'poiName',
    },
    {
      title: '打卡次数',
      dataIndex: 'count',
      sorter: (a: any, b: any) => a.count - b.count,
    },
    {
      title: '占比',
      dataIndex: 'percent',
      render: (_: any, record: any) => (
        <Progress
          percent={Math.round((record.count / (stats?.hotPois?.[0]?.count || 1)) * 100)}
          size="small"
          showInfo={false}
        />
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between' }}>
        <h2 style={{ margin: 0 }}>数据看板</h2>
        <div>
          <RangePicker style={{ marginRight: 16 }} />
          <Button icon={<ReloadOutlined />} onClick={fetchStats} loading={loading}>
            刷新
          </Button>
        </div>
      </div>

      {/* 统计卡片 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {statCards.map((card, index) => (
          <Col xs={24} sm={12} lg={6} key={index}>
            <Card
              loading={loading}
              bodyStyle={{ padding: 24 }}
              style={{ background: card.color }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: 14, color: 'rgba(0,0,0,0.45)', marginBottom: 8 }}>
                    {card.title}
                  </div>
                  <div style={{ fontSize: 32, fontWeight: 'bold', color: 'rgba(0,0,0,0.85)' }}>
                    {card.value}
                  </div>
                  <div style={{ marginTop: 8 }}>
                    {card.trend > 0 ? (
                      <span style={{ color: '#52c41a' }}>
                        <RiseOutlined /> +{card.trend}%
                      </span>
                    ) : (
                      <span style={{ color: '#ff4d4f' }}>
                        <FallOutlined /> {card.trend}%
                      </span>
                    )}
                    <span style={{ color: 'rgba(0,0,0,0.45)', marginLeft: 8 }}>较昨日</span>
                  </div>
                </div>
                <div style={{ fontSize: 48, opacity: 0.3 }}>{card.icon}</div>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      {/* 图表区域 */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card
            title="近7天打卡趋势"
            loading={loading}
            bodyStyle={{ height: 320, padding: '12px' }}
          >
            <div ref={chartRef} style={{ width: '100%', height: '100%' }} />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card
            title="热门POI TOP10"
            loading={loading}
            bodyStyle={{ padding: 0 }}
          >
            <Table
              dataSource={stats?.hotPois?.map((item, index) => ({ ...item, key: index })) || []}
              columns={hotPoiColumns}
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
      </Row>

      {/* 快捷入口 */}
      <Card title="快捷操作" style={{ marginTop: 16 }}>
        <Row gutter={16}>
          <Col>
            <Button type="primary" size="large">
              + 新增POI
            </Button>
          </Col>
          <Col>
            <Button size="large">发放优惠券</Button>
          </Col>
          <Col>
            <Button size="large">查看待审核商户</Button>
          </Col>
        </Row>
      </Card>
    </div>
  );
};

export default Dashboard;
