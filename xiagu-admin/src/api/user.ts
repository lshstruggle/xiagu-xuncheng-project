import { api } from './request';
import type { AppUser, PaginatedData } from '../types';

export const userApi = {
  // 列表
  getList: (params: {
    page?: number;
    pageSize?: number;
    status?: string;
    heroId?: string;
    keyword?: string;
  }) => api.get<PaginatedData<AppUser>>('/admin/users', { params }),

  // 详情
  getById: (id: string) => api.get<AppUser>(`/admin/users/${id}`),

  // 封禁
  ban: (id: string, data: { reason?: string }) =>
    api.post(`/admin/users/${id}/ban`, data),

  // 解封
  unban: (id: string) => api.post(`/admin/users/${id}/unban`),

  // 获取用户优惠券
  getUserCoupons: (id: string) => api.get(`/admin/users/${id}/coupons`),

  // 获取用户打卡记录
  getUserCheckins: (id: string) => api.get(`/admin/users/${id}/checkins`),

  // 统计
  getStats: () =>
    api.get<{
      total: number;
      today_new: number;
      active: number;
      banned: number;
    }>('/admin/users/stats'),
};
