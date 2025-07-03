/**
 * 脑图编辑器组件
 * 基于simple-mind-map的React封装组件
 */

'use client';

import React, { useEffect, useRef, useState, useCallback, forwardRef, useImperativeHandle } from 'react';

// 脑图数据接口
export interface MindMapData {
  data: {
    text: string;
    [key: string]: any;
  };
  children?: MindMapData[];
}

// 脑图配置接口
export interface MindMapConfig {
  layout?: string;
  theme?: string;
  readonly?: boolean;
  enableFreeDrag?: boolean;
  watermark?: {
    text?: string;
    lineSpacing?: number;
    textSpacing?: number;
    angle?: number;
    textStyle?: {
      color?: string;
      opacity?: number;
      fontSize?: number;
    };
  };
}

// 脑图编辑器属性接口
export interface MindMapEditorProps {
  // 数据源 - 可以是本地数据或脑图ID
  data?: MindMapData;
  mindMapId?: string; // 从后端加载数据的脑图ID

  config?: MindMapConfig;
  width?: string | number;
  height?: string | number;
  className?: string;

  // 事件回调
  onDataChange?: (data: MindMapData) => void;
  onNodeClick?: (node: any, e: Event) => void;
  onNodeDoubleClick?: (node: any, e: Event) => void;
  onReady?: (mindMap: any) => void;
  onError?: (error: Error) => void;
  onDataLoaded?: (data: any) => void; // 数据加载完成回调
  onSave?: (data: MindMapData) => Promise<void>; // 数据保存回调
  onSaveSuccess?: (data: any) => void; // 保存成功回调
  onSaveError?: (error: Error) => void; // 保存失败回调

  // 保存配置
  autoSave?: boolean; // 是否自动保存
  autoSaveInterval?: number; // 自动保存间隔(毫秒)
}

// 脑图编辑器引用接口
export interface MindMapEditorRef {
  getMindMapInstance: () => any;
  getData: () => MindMapData | null;
  setData: (data: MindMapData) => void;
  setTheme: (theme: string) => void;
  setLayout: (layout: string) => void;
  export: (type: string, options?: any) => Promise<any>;
  save: () => Promise<void>; // 手动保存
  destroy: () => void;
}

// 默认脑图数据
const defaultData: MindMapData = {
  data: {
    text: '中心主题'
  },
  children: [
    {
      data: {
        text: '分支主题1'
      },
      children: [
        {
          data: {
            text: '子主题1-1'
          }
        },
        {
          data: {
            text: '子主题1-2'
          }
        }
      ]
    },
    {
      data: {
        text: '分支主题2'
      },
      children: [
        {
          data: {
            text: '子主题2-1'
          }
        }
      ]
    }
  ]
};

// 默认配置
const defaultConfig: MindMapConfig = {
  layout: 'logicalStructure',
  theme: 'default',
  readonly: false,
  enableFreeDrag: false
};

const MindMapEditor = forwardRef<MindMapEditorRef, MindMapEditorProps>(({
  data,
  mindMapId,
  config = defaultConfig,
  width = '100%',
  height = '400px',
  className = '',
  onDataChange,
  onNodeClick,
  onNodeDoubleClick,
  onReady,
  onError,
  onDataLoaded,
  onSave,
  onSaveSuccess,
  onSaveError,
  autoSave = false,
  autoSaveInterval = 30000
}, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mindMapRef = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [MindMapClass, setMindMapClass] = useState<any>(null);
  const [currentData, setCurrentData] = useState<MindMapData | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastSaveTime, setLastSaveTime] = useState<Date | null>(null);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 动态导入simple-mind-map
  useEffect(() => {
    const loadMindMap = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // 动态导入simple-mind-map
        const mindMapModule = await import('simple-mind-map');
        const MindMap = mindMapModule.default;

        if (typeof MindMap !== 'function') {
          throw new Error('MindMap is not a valid constructor');
        }

        setMindMapClass(() => MindMap);
        console.log('MindMap loaded successfully');

      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load MindMap';
        console.error('Failed to load simple-mind-map:', err);
        setError(errorMessage);
        onError?.(err instanceof Error ? err : new Error(errorMessage));
      } finally {
        setIsLoading(false);
      }
    };

    loadMindMap();
  }, [onError]);

  // 从后端加载数据
  useEffect(() => {
    const loadDataFromBackend = async () => {
      if (!mindMapId) {
        // 如果没有mindMapId，使用传入的data或默认数据
        setCurrentData(data || defaultData);
        return;
      }

      try {
        setIsLoadingData(true);
        setError(null);

        // 动态导入API客户端
        const { getMindMap } = await import('@/lib/api/mindmap');
        const mindMapData = await getMindMap(mindMapId);

        // 转换后端数据格式为组件需要的格式
        const formattedData: MindMapData = mindMapData.data;

        setCurrentData(formattedData);
        onDataLoaded?.(mindMapData);
        console.log('MindMap data loaded from backend:', mindMapData);

      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load mindmap data';
        console.error('Failed to load mindmap data:', err);
        setError(errorMessage);
        onError?.(err instanceof Error ? err : new Error(errorMessage));

        // 加载失败时使用默认数据
        setCurrentData(data || defaultData);
      } finally {
        setIsLoadingData(false);
      }
    };

    loadDataFromBackend();
  }, [mindMapId, data, onDataLoaded, onError]);

  // 保存数据到后端
  const saveData = useCallback(async () => {
    if (!mindMapRef.current || !onSave || isSaving) {
      return;
    }

    try {
      setIsSaving(true);

      // 获取当前脑图数据
      const currentMindMapData = mindMapRef.current.getData();

      // 调用保存回调
      await onSave(currentMindMapData);

      setHasUnsavedChanges(false);
      setLastSaveTime(new Date());
      onSaveSuccess?.(currentMindMapData);

      console.log('Data saved successfully');

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save data';
      console.error('Failed to save data:', err);
      onSaveError?.(err instanceof Error ? err : new Error(errorMessage));
    } finally {
      setIsSaving(false);
    }
  }, [onSave, onSaveSuccess, onSaveError, isSaving]);

  // 自动保存逻辑
  useEffect(() => {
    if (!autoSave || !hasUnsavedChanges || !onSave) {
      return;
    }

    // 清除之前的定时器
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    // 设置新的定时器
    autoSaveTimerRef.current = setTimeout(() => {
      saveData();
    }, autoSaveInterval);

    // 清理函数
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [autoSave, hasUnsavedChanges, autoSaveInterval, saveData, onSave]);

  // 初始化脑图实例
  const initMindMap = useCallback(() => {
    if (!containerRef.current || !MindMapClass || !currentData) {
      return;
    }

    try {
      // 清空容器
      containerRef.current.innerHTML = '';

      // 合并配置
      const finalConfig = { ...defaultConfig, ...config };

      // 创建脑图实例
      const mindMap = new MindMapClass({
        el: containerRef.current,
        data: currentData,
        layout: finalConfig.layout,
        theme: finalConfig.theme,
        readonly: finalConfig.readonly,
        enableFreeDrag: finalConfig.enableFreeDrag,
        watermark: finalConfig.watermark,
        viewData: {
          scale: 1,
          x: 0,
          y: 0
        }
      });

      // 绑定事件
      if (onDataChange) {
        mindMap.on('data_change', (data: MindMapData) => {
          setHasUnsavedChanges(true);
          onDataChange(data);
        });
      } else {
        // 即使没有onDataChange回调，也要监听数据变化以标记未保存状态
        mindMap.on('data_change', () => {
          setHasUnsavedChanges(true);
        });
      }

      if (onNodeClick) {
        mindMap.on('node_click', onNodeClick);
      }

      if (onNodeDoubleClick) {
        mindMap.on('node_dblclick', onNodeDoubleClick);
      }

      mindMapRef.current = mindMap;
      onReady?.(mindMap);

      console.log('MindMap instance created successfully');

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create MindMap instance';
      console.error('Failed to create MindMap instance:', err);
      setError(errorMessage);
      onError?.(err instanceof Error ? err : new Error(errorMessage));
    }
  }, [MindMapClass, currentData, config, onDataChange, onNodeClick, onNodeDoubleClick, onReady, onError]);

  // 当MindMapClass和数据都加载完成后初始化脑图
  useEffect(() => {
    if (MindMapClass && !isLoading && !isLoadingData && currentData) {
      initMindMap();
    }

    // 清理函数
    return () => {
      if (mindMapRef.current) {
        try {
          mindMapRef.current.destroy();
          mindMapRef.current = null;
        } catch (err) {
          console.error('Failed to destroy MindMap instance:', err);
        }
      }
    };
  }, [MindMapClass, isLoading, isLoadingData, currentData, initMindMap]);

  // 暴露给父组件的方法
  useImperativeHandle(ref, () => ({
    getMindMapInstance: () => mindMapRef.current,
    
    getData: () => {
      if (mindMapRef.current) {
        try {
          return mindMapRef.current.getData();
        } catch (err) {
          console.error('Failed to get data:', err);
          return null;
        }
      }
      return null;
    },

    setData: (newData: MindMapData) => {
      if (mindMapRef.current) {
        try {
          mindMapRef.current.setData(newData);
        } catch (err) {
          console.error('Failed to set data:', err);
        }
      }
    },

    setTheme: (theme: string) => {
      if (mindMapRef.current) {
        try {
          mindMapRef.current.setTheme(theme);
        } catch (err) {
          console.error('Failed to set theme:', err);
        }
      }
    },

    setLayout: (layout: string) => {
      if (mindMapRef.current) {
        try {
          mindMapRef.current.setLayout(layout);
        } catch (err) {
          console.error('Failed to set layout:', err);
        }
      }
    },

    export: async (type: string, options?: unknown) => {
      if (mindMapRef.current) {
        try {
          return await mindMapRef.current.export(type, options);
        } catch (err) {
          console.error('Failed to export:', err);
          throw err;
        }
      }
      throw new Error('MindMap instance not available');
    },

    save: async () => {
      await saveData();
    },

    destroy: () => {
      if (mindMapRef.current) {
        try {
          mindMapRef.current.destroy();
          mindMapRef.current = null;
        } catch (err) {
          console.error('Failed to destroy MindMap instance:', err);
        }
      }
    }
  }), [saveData]);

  // 渲染加载状态
  if (isLoading || isLoadingData) {
    return (
      <div
        className={`flex items-center justify-center bg-gray-50 border border-gray-200 rounded-lg ${className}`}
        style={{ width, height }}
      >
        <div className="flex items-center space-x-2 text-gray-600">
          <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <span>
            {isLoading ? '加载脑图编辑器...' : '加载脑图数据...'}
          </span>
        </div>
      </div>
    );
  }

  // 渲染错误状态
  if (error) {
    return (
      <div 
        className={`flex items-center justify-center bg-red-50 border border-red-200 rounded-lg ${className}`}
        style={{ width, height }}
      >
        <div className="text-center text-red-600">
          <div className="text-lg font-medium mb-2">加载失败</div>
          <div className="text-sm">{error}</div>
        </div>
      </div>
    );
  }

  // 渲染脑图容器
  return (
    <div 
      ref={containerRef}
      className={`bg-white border border-gray-200 rounded-lg ${className}`}
      style={{ width, height }}
    />
  );
});

MindMapEditor.displayName = 'MindMapEditor';

export default MindMapEditor;
