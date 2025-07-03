/**
 * useMindMap Hook 单元测试
 */

import { renderHook, act } from '@testing-library/react'
import { useMindMap } from '../useMindMap'

// Mock fetch
global.fetch = jest.fn()

const mockFetch = fetch as jest.MockedFunction<typeof fetch>

describe('useMindMap Hook', () => {
  beforeEach(() => {
    mockFetch.mockClear()
  })

  describe('初始化状态', () => {
    it('应该有正确的初始状态', () => {
      const { result } = renderHook(() => useMindMap({ autoLoad: false }))

      expect(result.current.data).toBeNull()
      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBeNull()
      expect(result.current.isCreating).toBe(false)
      expect(result.current.isUpdating).toBe(false)
      expect(result.current.isDeleting).toBe(false)
    })
  })

  describe('创建脑图', () => {
    it('应该成功创建脑图', async () => {
      const mockMindMap = {
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
        json: async () => ({ success: true, data: mockMindMap })
      } as Response)

      const { result } = renderHook(() => useMindMap({ autoLoad: false }))

      await act(async () => {
        const newMindMap = await result.current.create({
          title: '测试脑图',
          description: '测试描述',
          layout: 'logicalStructure',
          theme: 'default',
          tags: ['测试'],
          data: { root: { data: { text: '测试脑图' }, children: [] } }
        })

        expect(newMindMap).toEqual(mockMindMap)
      })

      expect(mockFetch).toHaveBeenCalledWith('/api/mindmap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: '测试脑图',
          description: '测试描述',
          layout: 'logicalStructure',
          theme: 'default',
          tags: ['测试'],
          data: { root: { data: { text: '测试脑图' }, children: [] } }
        })
      })
    })

    it('应该处理创建失败的情况', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ success: false, error: '创建失败' })
      } as Response)

      const { result } = renderHook(() => useMindMap({ autoLoad: false }))

      await act(async () => {
        try {
          await result.current.create({
            title: '测试脑图',
            description: '测试描述',
            layout: 'logicalStructure',
            theme: 'default',
            tags: [],
            data: { root: { data: { text: '测试脑图' }, children: [] } }
          })
        } catch (error) {
          expect(error).toEqual(new Error('创建失败'))
        }
      })

      expect(result.current.error).toBe('创建失败')
    })
  })

  describe('加载脑图', () => {
    it('应该成功加载脑图', async () => {
      const mockMindMap = {
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
        json: async () => ({ success: true, data: mockMindMap })
      } as Response)

      const { result } = renderHook(() => useMindMap({ autoLoad: false }))

      await act(async () => {
        await result.current.load('1')
      })

      expect(result.current.data).toEqual(mockMindMap)
      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBeNull()
    })
  })

  describe('更新脑图', () => {
    it('应该成功更新脑图', async () => {
      const updatedMindMap = {
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
        json: async () => ({ success: true, data: updatedMindMap })
      } as Response)

      const { result } = renderHook(() => useMindMap({ autoLoad: false }))

      await act(async () => {
        const updated = await result.current.update('1', {
          title: '更新后的脑图',
          description: '更新后的描述',
          tags: ['更新']
        })

        expect(updated).toEqual(updatedMindMap)
      })

      expect(result.current.data).toEqual(updatedMindMap)
    })
  })

  describe('删除脑图', () => {
    it('应该成功删除脑图', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      } as Response)

      const { result } = renderHook(() => useMindMap({ autoLoad: false }))

      await act(async () => {
        await result.current.remove('1')
      })

      expect(mockFetch).toHaveBeenCalledWith('/api/mindmap/1', {
        method: 'DELETE'
      })
    })
  })

  describe('错误处理', () => {
    it('应该清除错误状态', () => {
      const { result } = renderHook(() => useMindMap({ autoLoad: false }))

      // 手动设置错误状态进行测试
      act(() => {
        result.current.clearError()
      })

      expect(result.current.error).toBeNull()
    })
  })
})
