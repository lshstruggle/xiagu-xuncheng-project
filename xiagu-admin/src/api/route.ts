import { api } from './request';
import type { Route, PaginatedData } from '../types';

export const routeApi = {
  // 列表
  getList: (params: {
    page?: number;
    pageSize?: number;
    cityCode?: string;
    difficulty?: string;
    status?: string;
    keyword?: string;
  }) => api.get<PaginatedData<Route>>('/admin/routes', { params }),

  // 详情
  getById: (id: string) => api.get<Route>(`/admin/routes/${id}`),

  // 创建
  create: (data: Partial<Route>) => api.post<Route>('/admin/routes', data),

  // 更新
  update: (id: string, data: Partial<Route>) =>
    api.put<Route>(`/admin/routes/${id}`, data),

  // 删除
  delete: (id: string) => api.delete(`/admin/routes/${id}`),

  // 更新POI顺序
  updatePOISequence: (id: string, poiSequence: string[]) =>
    api.put(`/admin/routes/${id}/poi-sequence`, { poi_sequence: poiSequence }),
};
