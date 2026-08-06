import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  Form,
  Input,
  Select,
  InputNumber,
  Button,
  Card,
  Steps,
  message,
  Tabs,
  Upload,
  Switch,
  Slider,
  Divider,
  Row,
  Col,
  Space,
  Modal,
} from 'antd';
import {
  SaveOutlined,
  ArrowLeftOutlined,
  UploadOutlined,
  EnvironmentOutlined,
  AimOutlined,
} from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import { poiApi, poiTypeApi } from '../../api/poi';
import { merchantApi } from '../../api/merchant';
import type { POITypeConfig, Merchant } from '../../types';


const { TextArea } = Input;
const { Option } = Select;

const POIEdit: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [poiTypes, setPoiTypes] = useState<POITypeConfig[]>([]);
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [mapModalVisible, setMapModalVisible] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const [tempLatLng, setTempLatLng] = useState<{ lat: number; lng: number } | null>(null);
  const isEdit = !!id;

  const steps = [
    { title: '基础信息', description: '名称、类型、商户' },
    { title: '位置设置', description: '地图选点、坐标' },
    { title: '内容配置', description: '描述、图片、语音' },
    { title: '奖励设置', description: '羁绊值、优惠券' },
  ];

  useEffect(() => {
    fetchPoiTypes();
    fetchMerchants();
    if (isEdit) {
      fetchPOIDetail();
    }
  }, [id]);

  // 加载腾讯地图脚本
  const loadTencentMapScript = useCallback(() => {
    return new Promise<void>((resolve, reject) => {
      if (window.TMap) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = `https://map.qq.com/api/gljs?v=1.exp&key=5ETBZ-LELYW-L7QR6-Y5L42-37DKV-3RFN6&callback=initTMap`;
      script.async = true;
      script.onerror = () => reject(new Error('腾讯地图加载失败'));

      window.initTMap = () => {
        resolve();
      };

      document.head.appendChild(script);
    });
  }, []);

  // 初始化地图
  const initMap = useCallback(async () => {
    if (!mapRef.current || !window.TMap) return;

    const TMap = window.TMap;
    const lat = form.getFieldValue('lat') || 30.659;
    const lng = form.getFieldValue('lng') || 104.065;

    // 如果地图已存在，先销毁
    if (mapInstanceRef.current) {
      mapInstanceRef.current.destroy();
      mapInstanceRef.current = null;
    }

    // 创建地图实例
    mapInstanceRef.current = new TMap.Map(mapRef.current, {
      center: new TMap.LatLng(lat, lng),
      zoom: 14,
      mapStyleId: 'style1',
    });

    // 创建标记
    markerRef.current = new TMap.MultiMarker({
      map: mapInstanceRef.current,
      styles: {
        'default': new TMap.MarkerStyle({
          width: 25,
          height: 35,
          anchor: { x: 12, y: 35 },
          color: '#1890ff',
        }),
      },
      geometries: [{
        id: 'marker',
        position: new TMap.LatLng(lat, lng),
        styleId: 'default',
      }],
    });

    // 点击地图更新位置
    mapInstanceRef.current.on('click', (e: any) => {
      const { lat, lng } = e.latLng;
      
      // 更新标记位置
      markerRef.current.setGeometries([{
        id: 'marker',
        position: new TMap.LatLng(lat, lng),
        styleId: 'default',
      }]);

      // 更新临时坐标
      setTempLatLng({
        lat: parseFloat(lat.toFixed(6)),
        lng: parseFloat(lng.toFixed(6)),
      });
    });
  }, [form]);

  // 打开地图弹窗
  const openMapModal = async () => {
    setTempLatLng(null);
    setMapModalVisible(true);
    await loadTencentMapScript();
    // 延迟初始化以确保容器已渲染
    setTimeout(initMap, 200);
  };

  // 确认选点
  const handleConfirmLocation = () => {
    if (tempLatLng) {
      form.setFieldsValue({
        lat: tempLatLng.lat,
        lng: tempLatLng.lng,
      });
      message.success(`已选择位置：${tempLatLng.lat}, ${tempLatLng.lng}`);
    }
    handleCloseMapModal();
  };

  // 关闭地图弹窗
  const handleCloseMapModal = () => {
    setMapModalVisible(false);
    setTempLatLng(null);
    // 销毁地图实例
    if (mapInstanceRef.current) {
      mapInstanceRef.current.destroy();
      mapInstanceRef.current = null;
    }
  };

  const fetchPoiTypes = async () => {
    try {
      const types = await poiTypeApi.getList();
      setPoiTypes(types);
    } catch {
      setPoiTypes([
        { id: '1', typeCode: 'blue_buff', typeName: '蓝Buff', icon: '', color: '#1890ff', description: '文化景点', isActive: true },
        { id: '2', typeCode: 'red_buff', typeName: '红Buff', icon: '', color: '#ff4d4f', description: '美食商户', isActive: true },
        { id: '3', typeCode: 'tower', typeName: '防御塔', icon: '', color: '#faad14', description: '城市地标', isActive: true },
        { id: '4', typeCode: 'spirit_lighthouse', typeName: '荣耀灯塔', icon: '', color: '#722ed1', description: '赛事场馆', isActive: true },
        { id: '5', typeCode: 'player_footprint', typeName: '选手足迹', icon: '', color: '#52c41a', description: '选手羁绊', isActive: true },
      ]);
    }
  };

  const fetchMerchants = async () => {
    try {
      const res = await merchantApi.getAll();
      setMerchants(res);
    } catch {
      setMerchants([]);
    }
  };

  const fetchPOIDetail = async () => {
    setLoading(true);
    try {
      const poi = await poiApi.getById(id!);
      form.setFieldsValue({
        ...poi,
        lat: poi.location?.coordinates?.[1],
        lng: poi.location?.coordinates?.[0],
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      
      // 构建提交数据
      const submitData = {
        ...values,
        location: {
          type: 'Point',
          coordinates: [values.lng, values.lat],
        },
      };
      delete submitData.lat;
      delete submitData.lng;

      if (isEdit) {
        await poiApi.update(id!, submitData);
        message.success('更新成功');
      } else {
        await poiApi.create(submitData);
        message.success('创建成功');
      }
      navigate('/poi');
    } catch (error) {
      message.error('保存失败，请检查表单');
    }
  };

  const renderBasicStep = () => (
    <Form
      form={form}
      layout="vertical"
      style={{ maxWidth: 600 }}
    >
      <Form.Item
        name="name"
        label="POI名称"
        rules={[{ required: true, message: '请输入POI名称' }]}
      >
        <Input placeholder="如：武侯祠" />
      </Form.Item>

      <Form.Item
        name="type"
        label="POI类型"
        rules={[{ required: true, message: '请选择POI类型' }]}
      >
        <Select placeholder="选择类型">
          {poiTypes.map(type => (
            <Option key={type.typeCode} value={type.typeCode}>
              <span style={{ color: type.color }}>●</span> {type.typeName}
              <span style={{ color: '#999', marginLeft: 8 }}>({type.description})</span>
            </Option>
          ))}
        </Select>
      </Form.Item>

      <Form.Item
        name="cityCode"
        label="所属城市"
        rules={[{ required: true, message: '请选择城市' }]}
      >
        <Select placeholder="选择城市">
          <Option value="CD">成都</Option>
          <Option value="SH">上海</Option>
          <Option value="BJ">北京</Option>
          <Option value="HZ">杭州</Option>
        </Select>
      </Form.Item>

      <Form.Item
        name="category"
        label="分类标签"
        rules={[{ required: true, message: '请输入分类' }]}
      >
        <Input placeholder="如：历史文化、美食、地标" />
      </Form.Item>

      <Form.Item
        name="merchantId"
        label="关联商户"
      >
        <Select placeholder="选择关联商户（可选）" allowClear>
          {merchants.map(m => (
            <Option key={m.id} value={m.id}>{m.name}</Option>
          ))}
        </Select>
      </Form.Item>

      <Form.Item
        name="status"
        label="状态"
        valuePropName="checked"
        initialValue={true}
      >
        <Switch checkedChildren="启用" unCheckedChildren="禁用" />
      </Form.Item>

      <Form.Item
        name="priority"
        label="优先级"
        initialValue={50}
      >
        <Slider min={0} max={100} marks={{ 0: '低', 50: '中', 100: '高' }} />
      </Form.Item>
    </Form>
  );

  const renderLocationStep = () => (
    <Form form={form} layout="vertical">
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            name="lat"
            label="纬度"
            rules={[{ required: true, message: '请输入纬度' }]}
          >
            <InputNumber
              style={{ width: '100%' }}
              placeholder="如：30.6461"
              precision={6}
              step={0.0001}
            />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            name="lng"
            label="经度"
            rules={[{ required: true, message: '请输入经度' }]}
          >
            <InputNumber
              style={{ width: '100%' }}
              placeholder="如：104.0479"
              precision={6}
              step={0.0001}
            />
          </Form.Item>
        </Col>
      </Row>

      <Form.Item label="地图选点">
        <Card
          style={{ height: 280, background: '#f5f5f5', textAlign: 'center' }}
          bodyStyle={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}
        >
          <div>
            <EnvironmentOutlined style={{ fontSize: 40, color: '#1890ff', marginBottom: 8 }} />
            <p style={{ color: '#666', marginBottom: 16 }}>点击按钮在地图上选择POI位置</p>
            <Button type="primary" icon={<AimOutlined />} onClick={openMapModal}>
              打开地图选点
            </Button>
          </div>
        </Card>
      </Form.Item>

      <Form.Item
        name="triggerRadius"
        label="触发半径（米）"
        initialValue={80}
      >
        <Slider
          min={20}
          max={500}
          step={10}
          marks={{ 20: '20m', 100: '100m', 200: '200m', 500: '500m' }}
        />
      </Form.Item>
    </Form>
  );

  const renderContentStep = () => (
    <Form form={form} layout="vertical">
      <Form.Item
        name="description"
        label="POI描述"
        rules={[{ required: true, message: '请输入描述' }]}
      >
        <TextArea
          rows={4}
          placeholder="描述该POI的特色和背景故事"
        />
      </Form.Item>

      <Form.Item
        name="images"
        label="POI图片"
        valuePropName="fileList"
      >
        <Upload
          listType="picture-card"
          multiple
          maxCount={5}
        >
          <div>
            <UploadOutlined />
            <div style={{ marginTop: 8 }}>上传图片</div>
          </div>
        </Upload>
      </Form.Item>

      <Divider>Hero Narration（英雄讲解词）</Divider>

      <Tabs
        type="card"
        items={[
          {
            key: 'li_bai',
            label: '李白',
            children: (
              <Form.Item name={['heroNarrations', 'li_bai']}>
                <TextArea
                  rows={6}
                  placeholder="李白在此POI的讲解词，支持换行"
                />
              </Form.Item>
            ),
          },
          {
            key: 'zhugeliang',
            label: '诸葛亮',
            children: (
              <Form.Item name={['heroNarrations', 'zhugeliang']}>
                <TextArea
                  rows={6}
                  placeholder="诸葛亮在此POI的讲解词"
                />
              </Form.Item>
            ),
          },
          {
            key: 'luban',
            label: '鲁班',
            children: (
              <Form.Item name={['heroNarrations', 'luban']}>
                <TextArea
                  rows={6}
                  placeholder="鲁班在此POI的讲解词"
                />
              </Form.Item>
            ),
          },
        ]}
      />
    </Form>
  );

  const renderRewardStep = () => (
    <Form form={form} layout="vertical">
      <Form.Item
        name={['rewards', 'bondValue']}
        label="羁绊值奖励"
        initialValue={10}
      >
        <InputNumber
          min={0}
          max={100}
          style={{ width: 200 }}
          addonAfter="点"
        />
      </Form.Item>

      <Form.Item label="关联勋章">
        <Select placeholder="选择关联勋章（可选）" allowClear>
          <Option value="badge_wuhou">三顾茅庐</Option>
          <Option value="badge_jinsha">古蜀探秘者</Option>
          <Option value="badge_kuanzhai">宽窄守护者</Option>
        </Select>
      </Form.Item>

      <Form.Item label="关联优惠券">
        <Select
          mode="multiple"
          placeholder="选择打卡时发放的优惠券"
          allowClear
          style={{ width: '100%' }}
        >
          <Option value="coupon_1">明婷饭店9折券</Option>
          <Option value="coupon_2">武侯祠门票8折券</Option>
          <Option value="coupon_3">川味小食兑换券</Option>
        </Select>
      </Form.Item>

      <Divider />

      <Form.Item label="彩蛋关联">
        <Card size="small" style={{ marginBottom: 16 }}>
          <p style={{ color: '#666', marginBottom: 16 }}>
            如需为此 POI 配置彩蛋，请前往
            <Button type="link" onClick={() => navigate('/easter-egg')}>
              彩蛋管理
            </Button>
            页面进行配置
          </p>
        </Card>
      </Form.Item>
    </Form>
  );

  const stepContents = [
    renderBasicStep(),
    renderLocationStep(),
    renderContentStep(),
    renderRewardStep(),
  ];

  return (
    <div>
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/poi')}>
          返回列表
        </Button>
        <h2 style={{ margin: 0 }}>{isEdit ? '编辑POI' : '新增POI'}</h2>
      </div>

      <Card loading={loading}>
        <Steps
          current={currentStep}
          onChange={setCurrentStep}
          direction="horizontal"
          style={{ marginBottom: 32 }}
          items={steps.map(step => ({ key: step.title, title: step.title, description: step.description }))}
        />

        <div style={{ minHeight: 400 }}>
          {stepContents[currentStep]}
        </div>

        <Divider />

        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <Button
            disabled={currentStep === 0}
            onClick={() => setCurrentStep(currentStep - 1)}
          >
            上一步
          </Button>
          
          <Space>
            {currentStep < steps.length - 1 ? (
              <Button
                type="primary"
                onClick={() => setCurrentStep(currentStep + 1)}
              >
                下一步
              </Button>
            ) : (
              <Button
                type="primary"
                icon={<SaveOutlined />}
                onClick={handleSave}
              >
                保存
              </Button>
            )}
          </Space>
        </div>
      </Card>

      {/* 地图选点弹窗 */}
      <Modal
        title="地图选点"
        open={mapModalVisible}
        onCancel={handleCloseMapModal}
        width={800}
        destroyOnClose={true}
        footer={[
          <Button key="cancel" onClick={handleCloseMapModal}>
            取消
          </Button>,
          <Button 
            key="confirm" 
            type="primary" 
            onClick={handleConfirmLocation}
            disabled={!tempLatLng}
          >
            确认选点
          </Button>,
        ]}
      >
        <div style={{ marginBottom: 12, color: '#666', fontSize: 14 }}>
          点击地图上的任意位置选择POI坐标，选中的坐标会高亮显示，确认后填入表单
          {tempLatLng && (
            <span style={{ color: '#1890ff', marginLeft: 16 }}>
              已选中：{tempLatLng.lat}, {tempLatLng.lng}
            </span>
          )}
        </div>
        <div
          ref={mapRef}
          style={{
            width: '100%',
            height: 450,
            borderRadius: 8,
            overflow: 'hidden',
          }}
        />
      </Modal>
    </div>
  );
};

export default POIEdit;
