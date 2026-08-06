import React from 'react';
import { Card, Form, Input, Button, Tabs, Select, Switch } from 'antd';
import { SaveOutlined, SettingOutlined } from '@ant-design/icons';

const Settings: React.FC = () => {
  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>系统设置</h2>
      
      <Tabs
        type="card"
        items={[
          {
            key: 'basic',
            label: '基础设置',
            children: (
              <Card>
                <Form layout="vertical" style={{ maxWidth: 600 }}>
                  <Form.Item label="系统名称">
                    <Input defaultValue="峡谷寻城记管理系统" />
                  </Form.Item>
                  <Form.Item label="客服电话">
                    <Input placeholder="400-xxx-xxxx" />
                  </Form.Item>
                  <Form.Item label="客服邮箱">
                    <Input placeholder="support@xiagu.com" />
                  </Form.Item>
                  <Form.Item>
                    <Button type="primary" icon={<SaveOutlined />}>保存</Button>
                  </Form.Item>
                </Form>
              </Card>
            ),
          },
          {
            key: 'map',
            label: '地图配置',
            children: (
              <Card>
                <Form layout="vertical" style={{ maxWidth: 600 }}>
                  <Form.Item label="默认中心纬度">
                    <Input defaultValue="30.66" />
                  </Form.Item>
                  <Form.Item label="默认中心经度">
                    <Input defaultValue="104.06" />
                  </Form.Item>
                  <Form.Item label="默认缩放级别">
                    <Select defaultValue="12">
                      <Select.Option value="10">10</Select.Option>
                      <Select.Option value="12">12</Select.Option>
                      <Select.Option value="14">14</Select.Option>
                    </Select>
                  </Form.Item>
                  <Form.Item>
                    <Button type="primary" icon={<SaveOutlined />}>保存</Button>
                  </Form.Item>
                </Form>
              </Card>
            ),
          },
          {
            key: 'poi-types',
            label: 'POI类型',
            children: (
              <Card>
                <p>POI类型管理功能开发中...</p>
              </Card>
            ),
          },
          {
            key: 'heroes',
            label: '英雄配置',
            children: (
              <Card>
                <p>英雄管理功能开发中...</p>
              </Card>
            ),
          },
          {
            key: 'logs',
            label: '操作日志',
            children: (
              <Card>
                <p>操作日志功能开发中...</p>
              </Card>
            ),
          },
        ]}
      />
    </div>
  );
};

export default Settings;
