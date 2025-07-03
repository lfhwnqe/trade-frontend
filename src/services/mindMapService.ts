/**
 * 脑图服务 - 处理脑图相关的API调用
 */

import type { 
  MindMapData, 
  CreateMindMapRequest, 
  UpdateMindMapRequest,
  MindMapListResponse,
  MindMapListParams 
} from '@/types/mindmap'

export class MindMapService {
  private static readonly BASE_URL = '/api/mindmap'

  /**
   * 创建新脑图
   */
  static async create(data: CreateMindMapRequest): Promise<MindMapData> {
    const response = await fetch(this.BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    const result = await response.json()

    if (!response.ok || !result.success) {
      throw new Error(result.error || '创建脑图失败')
    }

    return result.data
  }

  /**
   * 根据ID获取脑图
   */
  static async getById(id: string): Promise<MindMapData> {
    const response = await fetch(`${this.BASE_URL}/${id}`)
    const result = await response.json()

    if (!response.ok || !result.success) {
      throw new Error(result.error || '获取脑图失败')
    }

    return result.data
  }

  /**
   * 更新脑图
   */
  static async update(id: string, data: UpdateMindMapRequest): Promise<MindMapData> {
    const response = await fetch(`${this.BASE_URL}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    const result = await response.json()

    if (!response.ok || !result.success) {
      throw new Error(result.error || '更新脑图失败')
    }

    return result.data
  }

  /**
   * 删除脑图
   */
  static async delete(id: string): Promise<void> {
    const response = await fetch(`${this.BASE_URL}/${id}`, {
      method: 'DELETE',
    })

    const result = await response.json()

    if (!response.ok || !result.success) {
      throw new Error(result.error || '删除脑图失败')
    }
  }

  /**
   * 获取脑图列表
   */
  static async getList(params: MindMapListParams = {}): Promise<MindMapListResponse> {
    const {
      page = 1,
      limit = 10,
      search,
      tags,
      sortBy,
      sortOrder
    } = params

    const searchParams = new URLSearchParams({
      page: page.toString(),
      pageSize: limit.toString(),
    })

    if (search) {
      searchParams.append('search', search)
    }

    if (tags && tags.length > 0) {
      searchParams.append('tags', tags.join(','))
    }

    if (sortBy) {
      searchParams.append('sortBy', sortBy)
    }

    if (sortOrder) {
      searchParams.append('sortOrder', sortOrder)
    }

    const response = await fetch(`${this.BASE_URL}?${searchParams.toString()}`)
    const result = await response.json()

    if (!response.ok || !result.success) {
      throw new Error(result.error || '获取脑图列表失败')
    }

    return result.data
  }

  /**
   * 搜索脑图
   */
  static async search(query: string, options: Partial<MindMapListParams> = {}): Promise<MindMapListResponse> {
    return this.getList({
      ...options,
      search: query
    })
  }

  /**
   * 根据标签获取脑图
   */
  static async getByTags(tags: string[], options: Partial<MindMapListParams> = {}): Promise<MindMapListResponse> {
    return this.getList({
      ...options,
      tags
    })
  }
}
