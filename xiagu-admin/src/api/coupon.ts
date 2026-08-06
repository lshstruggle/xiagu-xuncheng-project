import { api } from './request';
import type { CouponDefinition, PaginatedData } from '../types';

export const couponApi = {
  // 列表
  getList: (params: {
    page?: number;
    pageSize?: number;
    type?: string;
    subType?: string;
    status?: string;
    keyword?: string;
  }) => api.get<PaginatedData<CouponDefinition>>('/admin/coupons', { params }),

  // 详情
  getById: (id: string) => api.get<CouponDefinition>(`/admin/coupons/${id}`),

  // 创建
  create: (data: Partial<CouponDefinition>) =>
    api.post<CouponDefinition>('/admin/coupons', data),

  // 更新
  update: (id: string, data: Partial<CouponDefinition>) =>
    api.put<CouponDefinition>(`/admin/coupons/${id}`, data),

  // 删除
  delete: (id: string) => api.delete(`/admin/coupons/${id}`),

  // 统计
  getStats: () =>
    api.get<{
      total: number;
      active: number;
      total_issued: number;
      total_used: number;
    }>('/admin/coupons/stats'),

  // 发放给用户
  issueToUser: (
    id: string,
    data: { userId: string; count: number }
  ) =>
    api.post(`/admin/coupons/${id}/issue`, data),
};
