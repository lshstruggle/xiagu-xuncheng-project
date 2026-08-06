import React, { useState } from 'react';
import { Form, Input, Button, Card, Tabs, message, Space, Typography } from 'antd';
import { UserOutlined, LockOutlined, WechatOutlined } from '@ant-design/icons';
import { useAuthStore } from '../../stores/auth';
import type { LoginForm } from '../../types';

const { Title, Text } = Typography;

const Login: React.FC = () => {
  const { login, isLoading } = useAuthStore();
  const [activeTab, setActiveTab] = useState('account');
  const [form] = Form.useForm();

  const handleLogin = async (values: LoginForm) => {
    try {
      await login(values);
      message.success('登录成功');
      // 不重定向，让 PublicRoute 检测到登录状态后自动跳转
    } catch (error) {
      // 错误已在拦截器处理
      console.error('登录失败:', error);
    }
  };

  const accountForm = (
    <Form
      form={form}
      name="login"
      onFinish={handleLogin}
      autoComplete="off"
      size="large"
    >
      <Form.Item
        name="username"
        rules={[{ required: true, message: '请输入用户名' }]}
      >
        <Input
          prefix={<UserOutlined />}
          placeholder="用户名"
        />
      </Form.Item>

      <Form.Item
        name="password"
        rules={[{ required: true, message: '请输入密码' }]}
      >
        <Input.Password
          prefix={<LockOutlined />}
          placeholder="密码"
        />
      </Form.Item>

      <Form.Item
        name="remember"
        valuePropName="checked"
        initialValue={true}
      >
        <Space style={{ justifyContent: 'space-between', width: '100%' }}>
          <span>记住登录状态</span>
          <a href="#forgot">忘记密码?</a>
        </Space>
      </Form.Item>

      <Form.Item>
        <Button
          type="primary"
          htmlType="submit"
          loading={isLoading}
          block
          size="large"
        >
          登 录
        </Button>
      </Form.Item>
    </Form>
  );

  const wechatForm = (
    <div style={{ textAlign: 'center', padding: '40px 0' }}>
      <div
        style={{
          width: 200,
          height: 200,
          margin: '0 auto 20px',
          background: '#f5f5f5',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 8,
        }}
      >
        <WechatOutlined style={{ fontSize: 64, color: '#07c160' }} />
      </div>
      <Text type="secondary">请使用微信扫描二维码登录</Text>
      <div style={{ marginTop: 20 }}>
        <Button type="primary" icon={<WechatOutlined />}>
          刷新二维码
        </Button>
      </div>
    </div>
  );

  const items = [
    {
      key: 'account',
      label: '账号登录',
      children: accountForm,
    },
    {
      key: 'wechat',
      label: (
        <span>
          <WechatOutlined style={{ color: '#07c160' }} />
          微信登录
        </span>
      ),
      children: wechatForm,
    },
  ];

  return (
    <div
      style={{
        height: '100vh',
        display: 'flex',
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
      }}
    >
      {/* 左侧品牌区域 */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          color: '#fff',
          padding: 48,
        }}
      >
        <div style={{ fontSize: 72, marginBottom: 24 }}>🎮</div>
        <Title level={1} style={{ color: '#fff', marginBottom: 16 }}>
          峡谷寻城记
        </Title>
        <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 18 }}>
          用脚步丈量王者峡谷
        </Text>
        <Text style={{ color: 'rgba(255,255,255,0.5)', marginTop: 8 }}>
          管理员后台系统
        </Text>
      </div>

      {/* 右侧登录表单 */}
      <div
        style={{
          width: 480,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 48,
        }}
      >
        <Card
          style={{
            width: '100%',
            borderRadius: 16,
            boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
          }}
          bodyStyle={{ padding: 40 }}
        >
          <Title level={3} style={{ textAlign: 'center', marginBottom: 32 }}>
            管理员登录
          </Title>

          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            items={items}
            centered
            style={{ marginBottom: 24 }}
          />

          <div style={{ textAlign: 'center', marginTop: 24 }}>
            <Text type="secondary" style={{ fontSize: 12 }}>
              © 2026 峡谷寻城记 · 管理系统
            </Text>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Login;
