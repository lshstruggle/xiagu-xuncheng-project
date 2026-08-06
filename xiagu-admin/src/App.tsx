import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider, Spin } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import MainLayout from './layouts/MainLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import POIManagement from './pages/POI';
import POIEdit from './pages/POI/Edit';
import MerchantManagement from './pages/Merchant';
import CouponManagement from './pages/Coupon';
import UserManagement from './pages/User';
import RouteManagement from './pages/Route';
import EasterEggManagement from './pages/EasterEgg';
import Settings from './pages/Settings';
import { useAuthStore } from './stores/auth';

// 路由守卫组件
const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, token } = useAuthStore();
  // 检查localStorage或sessionStorage中是否有token
  const hasToken = token || localStorage.getItem('admin_token') || sessionStorage.getItem('admin_token');
  return (isAuthenticated || hasToken) ? <>{children}</> : <Navigate to="/login" replace />;
};

// 公开路由（已登录用户不能访问登录页）
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, token } = useAuthStore();
  const hasToken = token || localStorage.getItem('admin_token') || sessionStorage.getItem('admin_token');
  return !(isAuthenticated || hasToken) ? <>{children}</> : <Navigate to="/" replace />;
};

// 初始化组件
const AppInitializer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isReady, setIsReady] = useState(false);
  const { setToken } = useAuthStore();

  useEffect(() => {
    // 从存储中恢复token
    const token = localStorage.getItem('admin_token') || sessionStorage.getItem('admin_token');
    if (token) {
      setToken(token);
    }
    setIsReady(true);
  }, [setToken]);

  if (!isReady) {
    return (
      <div style={{ 
        height: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center' 
      }}>
        <Spin size="large">
          <span style={{ marginTop: 16 }}>加载中...</span>
        </Spin>
      </div>
    );
  }

  return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        token: {
          colorPrimary: '#722ed1',
          borderRadius: 8,
        },
      }}
    >
      <BrowserRouter>
        <AppInitializer>
          <Routes>
            <Route
              path="/login"
              element={
                <PublicRoute>
                  <Login />
                </PublicRoute>
              }
            />
            
            <Route
              path="/"
              element={
                <PrivateRoute>
                  <MainLayout />
                </PrivateRoute>
              }
            >
              <Route index element={<Dashboard />} />
              
              {/* POI管理 */}
              <Route path="poi" element={<POIManagement />} />
              <Route path="poi/create" element={<POIEdit />} />
              <Route path="poi/edit/:id" element={<POIEdit />} />
              
              {/* 商户管理 */}
              <Route path="merchant" element={<MerchantManagement />} />
              
              {/* 优惠券管理 */}
              <Route path="coupon" element={<CouponManagement />} />
              
              {/* 路线管理 */}
              <Route path="route" element={<RouteManagement />} />
              
              {/* 彩蛋管理 */}
              <Route path="easter-egg" element={<EasterEggManagement />} />
              
              {/* 用户管理 */}
              <Route path="user" element={<UserManagement />} />
              
              {/* 系统设置 */}
              <Route path="settings" element={<Settings />} />
            </Route>
            
            {/* 404 */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AppInitializer>
      </BrowserRouter>
    </ConfigProvider>
  );
};

export default App;
