import { api } from './request';
import type { Merchant, PaginatedData } from '../types';

export const merchantApi = {
  // 列表
  getList: (params: {
    page?: number;
    pageSize?: number;
    category?: string;
    status?: string;
    keyword?: string;
  }) => api.get<PaginatedData<Merchant>>('/admin/merchants', { params }),

  // 详情
  getById: (id: string) => api.get<Merchant>(`/admin/merchants/${id}`),

  // 创建
  create: (data: Partial<Merchant>) => api.post<Merchant>('/admin/merchants', data),

  // 更新
  update: (id: string, data: Partial<Merchant>) =>
    api.put<Merchant>(`/admin/merchants/${id}`, data),

  // 删除
  delete: (id: string) => api.delete(`/admin/merchants/${id}`),

  // 获取关联的POI
  getRelatedPois: (id: string) =>
    api.get(`/admin/merchants/${id}/pois`),

  // 获取所有商户（下拉选择用）
  getAll: () => api.get<Merchant[]>('/admin/merchants/all'),
};
