/**
 * useMindMapList Hook 单元测试
 */

import { renderHook, act } from '@testing-library/react'
import { useMindMapList } from '../useMindMap'

// Mock fetch
global.fetch = jest.fn()

const mockFetch = fetch as jest.MockedFunction<typeof fetch>

describe('useMindMapList Hook', () => {
  beforeEach(() => {
    mockFetch.mockClear()
  })

  describe('初始化状态', () => {
    it('应该有正确的初始状态', () => {
      const { result } = renderHook(() => useMindMapList({ autoLoad: false }))

      expect(result.current.items).toEqual([])
      expect(result.current.total).toBe(0)
      expect(result.current.page).toBe(1)
      expect(result.current.limit).toBe(10)
      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBeNull()
    })

    it('应该使用自定义初始参数', () => {
      const { result } = renderHook(() => 
        useMindMapList({ 
          autoLoad: false, 
          initialPage: 2, 
          initialLimit: 20 
        })
      )

      expect(result.current.page).toBe(2)
      expect(result.current.limit).toBe(20)
    })
  })

  describe('加载脑图列表', () => {
    it('应该成功加载脑图列表', async () => {
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
          },
          {
            id: '2',
            title: '脑图2',
            description: '描述2',
            layout: 'mindMap',
            theme: 'dark',
            tags: ['标签2'],
            data: { root: { data: { text: '脑图2' }, children: [] } },
            createdAt: '2024-01-02T00:00:00Z',
            updatedAt: '2024-01-02T00:00:00Z'
          }
        ],
        total: 2,
        page: 1,
        limit: 10
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockResponse })
      } as Response)

      const { result } = renderHook(() => useMindMapList({ autoLoad: false }))

      await act(async () => {
        await result.current.load()
      })

      expect(result.current.items).toEqual(mockResponse.items)
      expect(result.current.total).toBe(2)
      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBeNull()
    })

    it('应该处理加载失败的情况', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ success: false, error: '加载失败' })
      } as Response)

      const { result } = renderHook(() => useMindMapList({ autoLoad: false }))

      await act(async () => {
        await result.current.load()
      })

      expect(result.current.error).toBe('加载失败')
      expect(result.current.items).toEqual([])
    })

    it('应该支持搜索参数', async () => {
      const mockResponse = {
        items: [],
        total: 0,
        page: 1,
        limit: 10
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockResponse })
      } as Response)

      const { result } = renderHook(() => useMindMapList({ autoLoad: false }))

      await act(async () => {
        await result.current.load({
          search: '测试搜索',
          tags: ['标签1', '标签2'],
          sortBy: 'title',
          sortOrder: 'desc'
        })
      })

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/mindmap?page=1&limit=10&search=%E6%B5%8B%E8%AF%95%E6%90%9C%E7%B4%A2&tags=%E6%A0%87%E7%AD%BE1%2C%E6%A0%87%E7%AD%BE2&sortBy=title&sortOrder=desc'
      )
    })
  })

  describe('分页功能', () => {
    it('应该正确设置页码', () => {
      const { result } = renderHook(() => useMindMapList({ autoLoad: false }))

      act(() => {
        result.current.setPage(3)
      })

      expect(result.current.page).toBe(3)
    })

    it('应该正确设置每页数量', () => {
      const { result } = renderHook(() => useMindMapList({ autoLoad: false }))

      act(() => {
        result.current.setLimit(25)
      })

      expect(result.current.limit).toBe(25)
    })
  })

  describe('刷新功能', () => {
    it('应该能够刷新列表', async () => {
      const mockResponse = {
        items: [],
        total: 0,
        page: 1,
        limit: 10
      }

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, data: mockResponse })
      } as Response)

      const { result } = renderHook(() => useMindMapList({ autoLoad: false }))

      await act(async () => {
        await result.current.refresh()
      })

      expect(mockFetch).toHaveBeenCalledTimes(1)
    })
  })

  describe('错误处理', () => {
    it('应该清除错误状态', () => {
      const { result } = renderHook(() => useMindMapList({ autoLoad: false }))

      act(() => {
        result.current.clearError()
      })

      expect(result.current.error).toBeNull()
    })
  })

  describe('自动加载', () => {
    it('当autoLoad为true时应该自动加载', async () => {
      const mockResponse = {
        items: [],
        total: 0,
        page: 1,
        limit: 10
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockResponse })
      } as Response)

      renderHook(() => useMindMapList({ autoLoad: true }))

      // 等待异步操作完成
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0))
      })

      expect(mockFetch).toHaveBeenCalledTimes(1)
    })
  })
})
