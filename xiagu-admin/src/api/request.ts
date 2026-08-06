import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosResponse } from 'axios';
import { message } from 'antd';
import { useAuthStore } from '../stores/auth';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1';

const request: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器
request.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('admin_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
request.interceptors.response.use(
  (response: AxiosResponse) => {
    const { code, message: msg, data } = response.data;
    
    if (code !== 0) {
      message.error(msg || '请求失败');
      return Promise.reject(new Error(msg));
    }
    
    return data;
  },
  (error) => {
    if (error.response) {
      const { status } = error.response;
      
      if (status === 401) {
        message.error('登录已过期，请重新登录');
        useAuthStore.getState().logout();
        window.location.href = '/login';
      } else if (status === 403) {
        message.error('没有权限执行此操作');
      } else {
        message.error(error.response.data?.message || '服务器错误');
      }
    } else {
      message.error('网络错误，请检查连接');
    }
    
    return Promise.reject(error);
  }
);

export default request;

// API 方法封装
export const api = {
  get: <T>(url: string, config?: AxiosRequestConfig) => 
    request.get<any, T>(url, config),
  
  post: <T>(url: string, data?: any, config?: AxiosRequestConfig) => 
    request.post<any, T>(url, data, config),
  
  put: <T>(url: string, data?: any, config?: AxiosRequestConfig) => 
    request.put<any, T>(url, data, config),
  
  delete: <T>(url: string, config?: AxiosRequestConfig) => 
    request.delete<any, T>(url, config),
};
