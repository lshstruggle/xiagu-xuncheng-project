import { api } from './request';
import type { PaginatedData } from '../types';

export const easterEggApi = {
  // 列表
  getList: (params: {
    page?: number;
    pageSize?: number;
    type?: string;
    rarity?: string;
    status?: string;
    keyword?: string;
  }) => api.get<PaginatedData<any>>('/admin/easter-eggs', { params }),

  // 详情
  getById: (id: string) => api.get<any>(`/admin/easter-eggs/${id}`),

  // 创建
  create: (data: any) => api.post<any>('/admin/easter-eggs', data),

  // 更新
  update: (id: string, data: any) =>
    api.put<any>(`/admin/easter-eggs/${id}`, data),

  // 删除
  delete: (id: string) => api.delete(`/admin/easter-eggs/${id}`),

  // 统计
  getStats: () =>
    api.get<{
      total: number;
      rarity_stats: { _id: string; count: number }[];
    }>('/admin/easter-eggs/stats'),
};
