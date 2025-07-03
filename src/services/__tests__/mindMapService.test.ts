/**
 * MindMapService 单元测试
 */

import { MindMapService } from '../mindMapService'
import type { MindMapData, CreateMindMapRequest, UpdateMindMapRequest } from '@/types/mindmap'

// Mock fetch
global.fetch = jest.fn()

const mockFetch = fetch as jest.MockedFunction<typeof fetch>

describe('MindMapService', () => {
  beforeEach(() => {
    mockFetch.mockClear()
  })

  describe('创建脑图', () => {
    it('应该成功创建脑图', async () => {
      const createRequest: CreateMindMapRequest = {
        title: '测试脑图',
        description: '测试描述',
        layout: 'logicalStructure',
        theme: 'default',
        tags: ['测试'],
        data: { root: { data: { text: '测试脑图' }, children: [] } }
      }

      const mockResponse: MindMapData = {
        id: '1',
        title: '测试脑图',
        description: '测试描述',
        layout: 'logicalStructure',
        theme: 'default',
        tags: ['测试'],
        data: { root: { data: { text: '测试脑图' }, children: [] } },
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockResponse })
      } as Response)

      const result = await MindMapService.create(createRequest)

      expect(result).toEqual(mockResponse)
      expect(mockFetch).toHaveBeenCalledWith('/api/mindmap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createRequest)
      })
    })

    it('应该处理创建失败的情况', async () => {
      const createRequest: CreateMindMapRequest = {
        title: '测试脑图',
        description: '测试描述',
        layout: 'logicalStructure',
        theme: 'default',
        tags: [],
        data: { root: { data: { text: '测试脑图' }, children: [] } }
      }

      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ success: false, error: '创建失败' })
      } as Response)

      await expect(MindMapService.create(createRequest)).rejects.toThrow('创建失败')
    })
  })

  describe('获取脑图', () => {
    it('应该成功获取脑图', async () => {
      const mockResponse: MindMapData = {
        id: '1',
        title: '测试脑图',
        description: '测试描述',
        layout: 'logicalStructure',
        theme: 'default',
        tags: ['测试'],
        data: { root: { data: { text: '测试脑图' }, children: [] } },
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockResponse })
      } as Response)

      const result = await MindMapService.getById('1')

      expect(result).toEqual(mockResponse)
      expect(mockFetch).toHaveBeenCalledWith('/api/mindmap/1')
    })

    it('应该处理获取失败的情况', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ success: false, error: '脑图不存在' })
      } as Response)

      await expect(MindMapService.getById('999')).rejects.toThrow('脑图不存在')
    })
  })

  describe('更新脑图', () => {
    it('应该成功更新脑图', async () => {
      const updateRequest: UpdateMindMapRequest = {
        title: '更新后的脑图',
        description: '更新后的描述',
        tags: ['更新']
      }

      const mockResponse: MindMapData = {
        id: '1',
        title: '更新后的脑图',
        description: '更新后的描述',
        layout: 'logicalStructure',
        theme: 'default',
        tags: ['更新'],
        data: { root: { data: { text: '更新后的脑图' }, children: [] } },
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T01:00:00Z'
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockResponse })
      } as Response)

      const result = await MindMapService.update('1', updateRequest)

      expect(result).toEqual(mockResponse)
      expect(mockFetch).toHaveBeenCalledWith('/api/mindmap/1', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateRequest)
      })
    })
  })

  describe('删除脑图', () => {
    it('应该成功删除脑图', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      } as Response)

      await MindMapService.delete('1')

      expect(mockFetch).toHaveBeenCalledWith('/api/mindmap/1', {
        method: 'DELETE'
      })
    })

    it('应该处理删除失败的情况', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ success: false, error: '删除失败' })
      } as Response)

      await expect(MindMapService.delete('1')).rejects.toThrow('删除失败')
    })
  })

  describe('获取脑图列表', () => {
    it('应该成功获取脑图列表', async () => {
      const mockResponse = {
        items: [
          {
            id: '1',
            title: '脑图1',
            description: '描述1',
            layout: 'logicalStructure',
            theme: 'default',
            tags: ['标签1'],
            data: { root: { data: { text: '脑图1' }, children: [] } },
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z'
          }
        ],
        total: 1,
        page: 1,
        limit: 10
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockResponse })
      } as Response)

      const result = await MindMapService.getList()

      expect(result).toEqual(mockResponse)
      expect(mockFetch).toHaveBeenCalledWith('/api/mindmap?page=1&limit=10')
    })

    it('应该支持查询参数', async () => {
      const mockResponse = {
        items: [],
        total: 0,
        page: 2,
        limit: 20
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockResponse })
      } as Response)

      const result = await MindMapService.getList({
        page: 2,
        limit: 20,
        search: '测试',
        tags: ['标签1'],
        sortBy: 'title',
        sortOrder: 'desc'
      })

      expect(result).toEqual(mockResponse)
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/mindmap?page=2&limit=20&search=%E6%B5%8B%E8%AF%95&tags=%E6%A0%87%E7%AD%BE1&sortBy=title&sortOrder=desc'
      )
    })
  })

  describe('网络错误处理', () => {
    it('应该处理网络错误', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      await expect(MindMapService.getById('1')).rejects.toThrow('Network error')
    })

    it('应该处理无效的JSON响应', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => { throw new Error('Invalid JSON') }
      } as Response)

      await expect(MindMapService.getById('1')).rejects.toThrow('Invalid JSON')
    })
  })
})
