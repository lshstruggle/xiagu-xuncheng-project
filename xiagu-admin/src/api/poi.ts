import { api } from './request';
import type { POI, PaginatedData, POITypeConfig } from '../types';

export const poiApi = {
  // 列表
  getList: (params: {
    page?: number;
    pageSize?: number;
    cityCode?: string;
    type?: string;
    status?: string;
    keyword?: string;
  }) => api.get<PaginatedData<POI>>('/admin/pois', { params }),

  // 详情
  getById: (id: string) => api.get<POI>(`/admin/pois/${id}`),

  // 创建
  create: (data: Partial<POI>) => api.post<POI>('/admin/pois', data),

  // 更新
  update: (id: string, data: Partial<POI>) =>
    api.put<POI>(`/admin/pois/${id}`, data),

  // 删除
  delete: (id: string) => api.delete(`/admin/pois/${id}`),

  // 批量删除
  batchDelete: (ids: string[]) =>
    api.post('/admin/pois/batch-delete', { ids }),

  // 批量更新状态
  batchUpdateStatus: (ids: string[], status: string) =>
    api.post('/admin/pois/batch-status', { ids, status }),

  // 复制POI
  clone: (id: string) => api.post<POI>(`/admin/pois/${id}/clone`),

  // 导入Excel
  importExcel: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post<{ success: number; failed: number; errors: string[] }>(
      '/admin/pois/import',
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
  },

  // 导出
  export: () =>
    api.get('/admin/pois/export', { responseType: 'blob' }),
};

// POI类型配置
export const poiTypeApi = {
  getList: () => api.get<POITypeConfig[]>('/admin/poi-types'),

  create: (data: Partial<POITypeConfig>) =>
    api.post<POITypeConfig>('/admin/poi-types', data),

  update: (id: string, data: Partial<POITypeConfig>) =>
    api.put<POITypeConfig>(`/admin/poi-types/${id}`, data),

  delete: (id: string) => api.delete(`/admin/poi-types/${id}`),
};
