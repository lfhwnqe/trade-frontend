import { useAtomImmer } from "@/hooks/useAtomImmer";
import { ragAtom, processSearchQuery, addSearchHistory } from "../atom";
import { useCallback, useRef } from "react";
import { searchDocuments } from "../request";
import { SearchQueryDto, RAGSearchForm, RetrievalResultDto } from "../types";
import { useAlert } from "@/components/common/alert";

// 参数预设接口
export interface SearchPreset {
  name: string;
  description: string;
  params: Partial<RAGSearchForm>;
}

// 搜索统计接口
export interface SearchStats {
  searchCount: number;
  avgResponseTime: number;
  maxSimilarityScore: number;
  minSimilarityScore: number;
  lastSearchTime: string | null;
}

// 用户配置接口
export interface UserConfig {
  name: string;
  params: Partial<RAGSearchForm>;
}

/**
 * RAG测试功能 hook
 */
export function useRagTest() {
  const [ragState, setRagState] = useAtomImmer(ragAtom);
  const [showAlert] = useAlert();
  
  // 防抖控制
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  
  // 预设配置
  const presets: SearchPreset[] = [
    {
      name: "精确搜索",
      description: "高相似度阈值，少量结果，重新排序",
      params: {
        maxResults: 5,
        similarityThreshold: 0.85,
        rerankResults: true,
        includeMetadata: true,
      }
    },
    {
      name: "模糊搜索", 
      description: "低相似度阈值，更多结果，包含元数据",
      params: {
        maxResults: 20,
        similarityThreshold: 0.5,
        rerankResults: false,
        includeMetadata: true,
      }
    },
    {
      name: "快速搜索",
      description: "中等相似度阈值，标准结果数量",
      params: {
        maxResults: 10,
        similarityThreshold: 0.7,
        rerankResults: false,
        includeMetadata: false,
      }
    }
  ];

  // 执行搜索
  const executeSearch = useCallback(async (customForm?: Partial<RAGSearchForm>) => {
    const searchForm = customForm || ragState.test.searchForm;
    
    if (!searchForm.query?.trim()) {
      showAlert('请输入搜索查询', 'error');
      return;
    }

    try {
      setRagState((draft) => {
        draft.test.loading = true;
      });

      const startTime = Date.now();
      const queryParams = processSearchQuery(searchForm as RAGSearchForm);
      const response = await searchDocuments(queryParams as unknown as SearchQueryDto);
      const endTime = Date.now();
      const processingTime = endTime - startTime;
      
      if (response.data) {
        setRagState((draft) => {
          draft.test.searchResult = {
            ...response.data!,
            processingTime,
          };
          draft.test.loading = false;
          
          // 添加到搜索历史
          draft.test.history = addSearchHistory(
            searchForm.query!,
            { ...response.data!, processingTime },
            draft.test.history
          );
        });
        
        showAlert('搜索完成', 'success');
      }
    } catch (error) {
      console.error('搜索失败:', error);
      setRagState((draft) => {
        draft.test.loading = false;
      });
      showAlert('搜索失败', 'error');
    }
  }, [ragState.test.searchForm, setRagState, showAlert]);

  // 防抖搜索
  const debouncedSearch = useCallback((customForm?: Partial<RAGSearchForm>) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    debounceRef.current = setTimeout(() => {
      executeSearch(customForm);
    }, 300);
  }, [executeSearch]);

  // 更新搜索表单
  const updateSearchForm = useCallback((field: keyof RAGSearchForm, value: unknown) => {
    setRagState((draft) => {
      (draft.test.searchForm as Record<string, unknown>)[field] = value;
    });
  }, [setRagState]);

  // 应用预设配置
  const applyPreset = useCallback((preset: SearchPreset) => {
    setRagState((draft) => {
      Object.assign(draft.test.searchForm, preset.params);
    });
    showAlert(`已应用预设: ${preset.name}`, 'success');
  }, [setRagState, showAlert]);

  // 重置表单
  const resetSearchForm = useCallback(() => {
    setRagState((draft) => {
      draft.test.searchForm = {
        query: '',
        maxResults: 10,
        similarityThreshold: 0.7,
        documentTypes: [],
        tags: [],
        rerankResults: true,
        includeMetadata: true,
      };
    });
  }, [setRagState]);

  // 从历史记录重新搜索
  const searchFromHistory = useCallback((historyItem: { query: string; result: unknown }) => {
    setRagState((draft) => {
      draft.test.searchForm.query = historyItem.query;
      draft.test.searchResult = historyItem.result as RetrievalResultDto;
    });
  }, [setRagState]);

  // 清空搜索历史
  const clearHistory = useCallback(() => {
    setRagState((draft) => {
      draft.test.history = [];
    });
    showAlert('搜索历史已清空', 'success');
  }, [setRagState, showAlert]);

  // 计算搜索统计
  const getSearchStats = useCallback((): SearchStats => {
    const { history } = ragState.test;
    
    if (history.length === 0) {
      return {
        searchCount: 0,
        avgResponseTime: 0,
        maxSimilarityScore: 0,
        minSimilarityScore: 0,
        lastSearchTime: null,
      };
    }

    const responseTimes = history.map(h => h.result.processingTime);
    const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
    
    // 获取所有搜索结果的相似度分数
    const allScores = history.flatMap(h => h.result.results.map(r => r.score));
    const maxSimilarityScore = allScores.length > 0 ? Math.max(...allScores) : 0;
    const minSimilarityScore = allScores.length > 0 ? Math.min(...allScores) : 0;
    
    return {
      searchCount: history.length,
      avgResponseTime: Math.round(avgResponseTime),
      maxSimilarityScore,
      minSimilarityScore,
      lastSearchTime: history[0]?.timestamp || null,
    };
  }, [ragState.test.history]);

  // 生成上下文预览
  const generateContextPreview = useCallback((): string => {
    const { searchResult } = ragState.test;
    
    if (!searchResult?.results?.length) {
      return '';
    }

    const contexts = searchResult.results
      .slice(0, 5) // 取前5个结果
      .map((result, index) => {
        return `[片段 ${index + 1}] (相似度: ${(result.score * 100).toFixed(1)}%)\n${result.content}\n`;
      });

    return `查询: "${searchResult.query}"\n\n上下文信息:\n\n${contexts.join('\n')}`;
  }, [ragState.test.searchResult]);

  // 保存用户配置
  const saveUserConfig = useCallback((name: string) => {
    const config: UserConfig = {
      name,
      params: { ...ragState.test.searchForm },
    };
    
    // 这里可以保存到 localStorage 或发送到服务器
    const savedConfigs = JSON.parse(localStorage.getItem('rag-user-configs') || '[]');
    const updatedConfigs = [config, ...savedConfigs.filter((c: UserConfig) => c.name !== name)];
    localStorage.setItem('rag-user-configs', JSON.stringify(updatedConfigs));
    
    showAlert(`配置 "${name}" 已保存`, 'success');
  }, [ragState.test.searchForm, showAlert]);

  // 加载用户配置
  const loadUserConfig = useCallback((config: UserConfig) => {
    setRagState((draft) => {
      Object.assign(draft.test.searchForm, config.params);
    });
    showAlert(`已加载配置: ${config.name}`, 'success');
  }, [setRagState, showAlert]);

  // 获取保存的用户配置
  const getUserConfigs = useCallback((): UserConfig[] => {
    return JSON.parse(localStorage.getItem('rag-user-configs') || '[]');
  }, []);

  // 删除用户配置
  const deleteUserConfig = useCallback((name: string) => {
    const savedConfigs = JSON.parse(localStorage.getItem('rag-user-configs') || '[]');
    const updatedConfigs = savedConfigs.filter((c: UserConfig) => c.name !== name);
    localStorage.setItem('rag-user-configs', JSON.stringify(updatedConfigs));
    showAlert(`配置 "${name}" 已删除`, 'success');
  }, [showAlert]);

  return {
    // 状态
    searchForm: ragState.test.searchForm,
    searchResult: ragState.test.searchResult,
    loading: ragState.test.loading,
    history: ragState.test.history,
    
    // 预设和配置
    presets,
    
    // 搜索操作
    executeSearch,
    debouncedSearch,
    updateSearchForm,
    resetSearchForm,
    
    // 预设操作
    applyPreset,
    
    // 历史操作
    searchFromHistory,
    clearHistory,
    
    // 统计和分析
    getSearchStats,
    generateContextPreview,
    
    // 用户配置
    saveUserConfig,
    loadUserConfig,
    getUserConfigs,
    deleteUserConfig,
  };
}