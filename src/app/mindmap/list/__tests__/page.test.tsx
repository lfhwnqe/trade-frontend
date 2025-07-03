/**
 * 脑图列表页面组件测试
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import MindMapListPage from '../page'

// Mock hooks
jest.mock('@/hooks/useMindMap', () => ({
  useMindMapList: jest.fn()
}))

// Mock Next.js Link
jest.mock('next/link', () => {
  return function MockLink({ children, href }: { children: React.ReactNode; href: string }) {
    return <a href={href}>{children}</a>
  }
})

const mockUseMindMapList = require('@/hooks/useMindMap').useMindMapList

describe('MindMapListPage', () => {
  const mockMindMaps = [
    {
      id: '1',
      title: '测试脑图1',
      description: '这是第一个测试脑图',
      layout: 'logicalStructure',
      theme: 'default',
      tags: ['测试', '工作'],
      data: { root: { data: { text: '测试脑图1' }, children: [] } },
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z'
    },
    {
      id: '2',
      title: '测试脑图2',
      description: '这是第二个测试脑图',
      layout: 'mindMap',
      theme: 'dark',
      tags: ['学习', '笔记'],
      data: { root: { data: { text: '测试脑图2' }, children: [] } },
      createdAt: '2024-01-02T00:00:00Z',
      updatedAt: '2024-01-02T00:00:00Z'
    }
  ]

  const defaultMockReturn = {
    items: mockMindMaps,
    total: 2,
    page: 1,
    limit: 10,
    totalPages: 1,
    isLoading: false,
    error: null,
    load: jest.fn(),
    refresh: jest.fn(),
    setPage: jest.fn(),
    setLimit: jest.fn(),
    clearError: jest.fn()
  }

  beforeEach(() => {
    mockUseMindMapList.mockReturnValue(defaultMockReturn)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('页面渲染', () => {
    it('应该正确渲染页面标题和描述', () => {
      render(<MindMapListPage />)

      expect(screen.getByText('我的脑图')).toBeInTheDocument()
      expect(screen.getByText(/管理您的所有思维导图/)).toBeInTheDocument()
    })

    it('应该渲染创建新脑图按钮', () => {
      render(<MindMapListPage />)

      const createButton = screen.getByRole('link', { name: /创建新脑图/i })
      expect(createButton).toBeInTheDocument()
      expect(createButton).toHaveAttribute('href', '/mindmap/new')
    })

    it('应该渲染搜索框', () => {
      render(<MindMapListPage />)

      const searchInput = screen.getByPlaceholderText('搜索脑图标题或描述...')
      expect(searchInput).toBeInTheDocument()
    })
  })

  describe('脑图列表显示', () => {
    it('应该显示脑图列表', () => {
      render(<MindMapListPage />)

      expect(screen.getByText('测试脑图1')).toBeInTheDocument()
      expect(screen.getByText('测试脑图2')).toBeInTheDocument()
      expect(screen.getByText('这是第一个测试脑图')).toBeInTheDocument()
      expect(screen.getByText('这是第二个测试脑图')).toBeInTheDocument()
    })

    it('应该显示脑图标签', () => {
      render(<MindMapListPage />)

      // 检查标签是否显示（使用更精确的选择器）
      const testTagElements = screen.getAllByText('测试')
      expect(testTagElements.length).toBeGreaterThan(0)
      const workTagElements = screen.getAllByText('工作')
      expect(workTagElements.length).toBeGreaterThan(0)
      const studyTagElements = screen.getAllByText('学习')
      expect(studyTagElements.length).toBeGreaterThan(0)
      const noteTagElements = screen.getAllByText('笔记')
      expect(noteTagElements.length).toBeGreaterThan(0)
    })

    it('应该显示操作按钮', () => {
      render(<MindMapListPage />)

      const viewButtons = screen.getAllByText('查看')
      const editButtons = screen.getAllByText('编辑')
      const deleteButtons = screen.getAllByRole('button', { name: '' }) // 删除按钮只有图标

      expect(viewButtons).toHaveLength(2)
      expect(editButtons).toHaveLength(2)
      expect(deleteButtons.length).toBeGreaterThanOrEqual(2)
    })
  })

  describe('加载状态', () => {
    it('应该显示加载状态', () => {
      mockUseMindMapList.mockReturnValue({
        ...defaultMockReturn,
        isLoading: true,
        items: []
      })

      render(<MindMapListPage />)

      expect(screen.getByText('加载脑图列表...')).toBeInTheDocument()
    })
  })

  describe('空状态', () => {
    it('应该显示空状态当没有脑图时', () => {
      mockUseMindMapList.mockReturnValue({
        ...defaultMockReturn,
        items: [],
        total: 0
      })

      render(<MindMapListPage />)

      expect(screen.getByText('还没有脑图')).toBeInTheDocument()
      expect(screen.getByText('创建您的第一个思维导图开始使用')).toBeInTheDocument()
    })

    it('应该显示搜索无结果状态', async () => {
      const user = userEvent.setup()
      
      mockUseMindMapList.mockReturnValue({
        ...defaultMockReturn,
        items: [],
        total: 0
      })

      render(<MindMapListPage />)

      const searchInput = screen.getByPlaceholderText('搜索脑图标题或描述...')
      await user.type(searchInput, '不存在的脑图')

      expect(screen.getByText('未找到匹配的脑图')).toBeInTheDocument()
      expect(screen.getByText('尝试调整搜索条件或过滤器')).toBeInTheDocument()
    })
  })

  describe('搜索功能', () => {
    it('应该能够输入搜索关键词', async () => {
      const user = userEvent.setup()
      const mockLoad = jest.fn()
      
      mockUseMindMapList.mockReturnValue({
        ...defaultMockReturn,
        load: mockLoad
      })

      render(<MindMapListPage />)

      const searchInput = screen.getByPlaceholderText('搜索脑图标题或描述...')
      await user.type(searchInput, '测试搜索')

      expect(searchInput).toHaveValue('测试搜索')
    })

    it('应该能够点击搜索按钮', async () => {
      const user = userEvent.setup()
      const mockLoad = jest.fn()
      
      mockUseMindMapList.mockReturnValue({
        ...defaultMockReturn,
        load: mockLoad
      })

      render(<MindMapListPage />)

      const searchInput = screen.getByPlaceholderText('搜索脑图标题或描述...')
      const searchButton = screen.getByRole('button', { name: /搜索/i })

      await user.type(searchInput, '测试搜索')
      await user.click(searchButton)

      expect(mockLoad).toHaveBeenCalledWith({
        search: '测试搜索',
        tags: [],
        sortBy: 'updatedAt',
        sortOrder: 'desc'
      })
    })

    it('应该支持回车键搜索', async () => {
      const user = userEvent.setup()
      const mockLoad = jest.fn()
      
      mockUseMindMapList.mockReturnValue({
        ...defaultMockReturn,
        load: mockLoad
      })

      render(<MindMapListPage />)

      const searchInput = screen.getByPlaceholderText('搜索脑图标题或描述...')
      
      await user.type(searchInput, '测试搜索')
      await user.keyboard('{Enter}')

      expect(mockLoad).toHaveBeenCalledWith({
        search: '测试搜索',
        tags: [],
        sortBy: 'updatedAt',
        sortOrder: 'desc'
      })
    })
  })

  describe('错误处理', () => {
    it('应该显示错误信息', () => {
      mockUseMindMapList.mockReturnValue({
        ...defaultMockReturn,
        error: '加载失败'
      })

      render(<MindMapListPage />)

      expect(screen.getByText('加载失败')).toBeInTheDocument()
    })

    it('应该能够关闭错误提示', async () => {
      const user = userEvent.setup()
      const mockClearError = jest.fn()
      
      mockUseMindMapList.mockReturnValue({
        ...defaultMockReturn,
        error: '加载失败',
        clearError: mockClearError
      })

      render(<MindMapListPage />)

      const closeButton = screen.getByRole('button', { name: /关闭/i })
      await user.click(closeButton)

      expect(mockClearError).toHaveBeenCalled()
    })
  })

  describe('分页功能', () => {
    it('应该显示分页控件当有多页时', () => {
      mockUseMindMapList.mockReturnValue({
        ...defaultMockReturn,
        total: 25,
        page: 2,
        limit: 10,
        totalPages: 3
      })

      render(<MindMapListPage />)

      expect(screen.getByText('第 2 页，共 3 页')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: '上一页' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: '下一页' })).toBeInTheDocument()
    })

    it('应该能够切换页码', async () => {
      const user = userEvent.setup()
      const mockSetPage = jest.fn()
      
      mockUseMindMapList.mockReturnValue({
        ...defaultMockReturn,
        total: 25,
        page: 2,
        limit: 10,
        totalPages: 3,
        setPage: mockSetPage
      })

      render(<MindMapListPage />)

      const nextButton = screen.getByRole('button', { name: '下一页' })
      await user.click(nextButton)

      expect(mockSetPage).toHaveBeenCalledWith(3)
    })
  })
})
