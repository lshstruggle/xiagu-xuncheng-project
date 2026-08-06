import { api } from './request';
import type { 
  AdminUser, 
  LoginForm, 
  DashboardStats
} from '../types';

// 认证相关
export const authApi = {
  login: (data: LoginForm) => 
    api.post<{ token: string; user: AdminUser }>('/admin/login', data),
  
  logout: () => 
    api.post('/admin/logout'),
  
  getProfile: () => 
    api.get<AdminUser>('/admin/profile'),
  
  // 微信扫码登录
  getWechatQRCode: () => 
    api.get<{ qrcodeUrl: string; sceneId: string }>('/admin/wechat/qrcode'),
  
  checkWechatLogin: (sceneId: string) => 
    api.get<{ status: 'pending' | 'success' | 'expired'; token?: string; user?: AdminUser }>(`/admin/wechat/check?sceneId=${sceneId}`),
};

// 数据统计
export const statsApi = {
  getDashboard: () => 
    api.get<DashboardStats>('/admin/stats/dashboard'),
  
  getTrends: (days: number = 7) => 
    api.get('/admin/stats/trends', { params: { days } }),
  
  getHotPois: (limit: number = 10) => 
    api.get('/admin/stats/hot-pois', { params: { limit } }),
  
  getGeoHeatmap: () => 
    api.get('/admin/stats/geo-heatmap'),
};

// 文件上传
export const uploadApi = {
  uploadImage: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post<{ url: string }>('/admin/upload/image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};
