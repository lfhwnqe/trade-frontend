import { useAtomImmer } from "@/hooks/useAtomImmer";
import { ragAtom } from "../atom";
import { useCallback, useRef } from "react";
import { 
  getDocuments, 
  createDocument, 
  updateDocument, 
  deleteDocument, 
  getDocument,
  getRAGAnalytics 
} from "../request";
import { isErrorWithMessage } from "@/utils";
import { 
  DocumentEntity, 
  CreateDocumentDto, 
  UpdateDocumentDto, 
  DocumentFilter 
} from "../types";
import {
  SortingState,
  RowSelectionState,
} from "@tanstack/react-table";
import { useAlert } from "@/components/common/alert";

/**
 * RAG数据管理 hook
 * 使用 jotai 和 jotai-immer 组装状态管理
 */
export function useRagManage() {
  const [ragState, setRagState, resetState] = useAtomImmer(ragAtom);
  const [showAlert] = useAlert();

  // 节流控制
  const throttleRef = useRef<NodeJS.Timeout | null>(null);

  // 获取所有文档数据
  const fetchDocuments = useCallback(
    async (
      _page = ragState.manage.pagination.page,
      _pageSize = ragState.manage.pagination.pageSize,
      _filters = ragState.manage.queryForm
    ) => {
      // 清除之前的定时器
      if (throttleRef.current) {
        clearTimeout(throttleRef.current);
      }

      // 立即设置loading状态
      setRagState((draft) => {
        draft.manage.loading = true;
      });

      // 节流执行请求
      throttleRef.current = setTimeout(async () => {
        try {
          const filters: DocumentFilter = {
            page: _page,
            pageSize: _pageSize,
            documentType: _filters.documentType === 'all' ? undefined : _filters.documentType,
            status: _filters.status === 'all' ? undefined : _filters.status,
            tags: _filters.tags,
            dateRange: _filters.dateRange,
          };

          const response = await getDocuments(filters);
          console.log('getDocuments response',response);
          setRagState((draft) => {
            draft.manage.documents = response.data || [];
            draft.manage.loading = false;
            draft.manage.pagination.total = response.data?.length || 0;
            draft.manage.pagination.totalPages = Math.ceil((response.data?.length || 0) / _pageSize);
          });
        } catch (error) {
          console.error('获取文档列表失败:', error);
          setRagState((draft) => {
            draft.manage.loading = false;
            draft.manage.documents = [];
            draft.manage.pagination.total = 0;
            draft.manage.pagination.totalPages = 1;
          });
          
          if (isErrorWithMessage(error)) {
            showAlert("获取文档列表失败: " + error.message, 'error');
          } else {
            showAlert("获取文档列表失败: 系统错误", 'error');
          }
        }
      }, 300); // 300ms 节流
    },
    [
      setRagState,
      ragState.manage.pagination.page,
      ragState.manage.pagination.pageSize,
      ragState.manage.queryForm,
      showAlert,
    ]
  );

  // 获取统计数据
  const fetchAnalytics = useCallback(async () => {
    try {
      setRagState((draft) => {
        draft.analytics.loading = true;
      });

      const response = await getRAGAnalytics();
      
      setRagState((draft) => {
        draft.analytics.analytics = response.data || null;
        draft.analytics.loading = false;
        draft.analytics.lastUpdated = new Date().toISOString();
      });
    } catch (error) {
      console.error('获取统计数据失败:', error);
      setRagState((draft) => {
        draft.analytics.loading = false;
      });
    }
  }, [setRagState]);

  // 更新查询表单
  const updateQueryForm = useCallback(
    (newQueryForm: typeof ragState.manage.queryForm) => {
      setRagState((draft) => {
        draft.manage.queryForm = newQueryForm;
      });
    },
    [setRagState]
  );

  // 更新排序
  const updateSorting = useCallback(
    (newSorting: SortingState) => {
      setRagState((draft) => {
        draft.manage.sorting = newSorting;
      });
    },
    [setRagState]
  );

  // 更新行选择
  const updateRowSelection = useCallback(
    (newSelection: RowSelectionState) => {
      setRagState((draft) => {
        draft.manage.rowSelection = newSelection;
      });
    },
    [setRagState]
  );

  // 更新分页并触发数据获取
  const updatePagination = useCallback(
    (page?: number, pageSize?: number) => {
      setRagState((draft) => {
        if (page !== undefined) draft.manage.pagination.page = page;
        if (pageSize !== undefined) draft.manage.pagination.pageSize = pageSize;
      });
      
      // 立即触发数据获取
      const newPage = page !== undefined ? page : ragState.manage.pagination.page;
      const newPageSize = pageSize !== undefined ? pageSize : ragState.manage.pagination.pageSize;
      fetchDocuments(newPage, newPageSize, ragState.manage.queryForm);
    },
    [setRagState, ragState.manage.pagination.page, ragState.manage.pagination.pageSize, ragState.manage.queryForm, fetchDocuments]
  );

  // 打开添加对话框
  const openAddDialog = useCallback(() => {
    setRagState((draft) => {
      draft.manage.dialog.open = true;
      draft.manage.dialog.editDocument = null;
      draft.manage.dialog.form = {};
    });
  }, [setRagState]);

  // 打开编辑对话框
  const openEditDialog = useCallback(
    (document: DocumentEntity) => {
      setRagState((draft) => {
        draft.manage.dialog.open = true;
        draft.manage.dialog.editDocument = document;
        draft.manage.dialog.form = {
          title: document.title,
          documentType: document.documentType,
          metadata: document.metadata,
        };
      });
    },
    [setRagState]
  );

  // 关闭对话框
  const closeDialog = useCallback(() => {
    setRagState((draft) => {
      draft.manage.dialog.open = false;
      draft.manage.dialog.editDocument = null;
      draft.manage.dialog.form = {};
    });
  }, [setRagState]);

  // 更新表单
  const updateForm = useCallback(
    (newForm: Partial<CreateDocumentDto>) => {
      setRagState((draft) => {
        draft.manage.dialog.form = { ...draft.manage.dialog.form, ...newForm };
      });
    },
    [setRagState]
  );

  // 设置要删除的 ID
  const setDeleteId = useCallback(
    (id: string | null) => {
      setRagState((draft) => {
        draft.manage.dialog.deleteId = id;
      });
    },
    [setRagState]
  );

  // 创建文档
  const handleCreateDocument = useCallback(
    async (data: CreateDocumentDto) => {
      try {
        await createDocument(data);
        showAlert('文档创建成功', 'success');
        closeDialog();
        fetchDocuments(); // 重新获取列表
        fetchAnalytics(); // 刷新统计数据
      } catch (error) {
        console.error('创建文档失败:', error);
        if (isErrorWithMessage(error)) {
          showAlert("创建文档失败: " + error.message, 'error');
        } else {
          showAlert("创建文档失败: 未知错误", 'error');
        }
      }
    },
    [showAlert, closeDialog, fetchDocuments, fetchAnalytics]
  );

  // 更新文档
  const handleUpdateDocument = useCallback(
    async (documentId: string, data: UpdateDocumentDto) => {
      try {
        await updateDocument(documentId, data);
        showAlert('文档更新成功', 'success');
        closeDialog();
        fetchDocuments(); // 重新获取列表
      } catch (error) {
        console.error('更新文档失败:', error);
        if (isErrorWithMessage(error)) {
          showAlert("更新文档失败: " + error.message, 'error');
        } else {
          showAlert("更新文档失败: 未知错误", 'error');
        }
      }
    },
    [showAlert, closeDialog, fetchDocuments]
  );

  // 删除文档
  const handleDeleteDocument = useCallback(
    async (documentId: string) => {
      try {
        await deleteDocument(documentId);
        showAlert('文档删除成功', 'success');
        setDeleteId(null);
        fetchDocuments(); // 重新获取列表
        fetchAnalytics(); // 刷新统计数据
      } catch (error) {
        console.error('删除文档失败:', error);
        if (isErrorWithMessage(error)) {
          showAlert("删除文档失败: " + error.message, 'error');
        } else {
          showAlert("删除文档失败: 未知错误", 'error');
        }
      }
    },
    [showAlert, setDeleteId, fetchDocuments, fetchAnalytics]
  );

  // 获取文档详情
  const fetchDocumentDetail = useCallback(
    async (documentId: string) => {
      try {
        const response = await getDocument(documentId);
        return response.data;
      } catch (error) {
        console.error('获取文档详情失败:', error);
        if (isErrorWithMessage(error)) {
          showAlert("获取文档详情失败: " + error.message, 'error');
        } else {
          showAlert("获取文档详情失败: 未知错误", 'error');
        }
        return null;
      }
    },
    [showAlert]
  );

  return {
    // 状态
    documents: ragState.manage.documents,
    loading: ragState.manage.loading,
    pagination: ragState.manage.pagination,
    queryForm: ragState.manage.queryForm,
    sorting: ragState.manage.sorting,
    rowSelection: ragState.manage.rowSelection,
    dialog: ragState.manage.dialog,
    analytics: ragState.analytics,

    // 方法
    fetchDocuments,
    fetchAnalytics,
    updateQueryForm,
    updateSorting,
    updateRowSelection,
    updatePagination,
    openAddDialog,
    openEditDialog,
    closeDialog,
    updateForm,
    setDeleteId,
    handleCreateDocument,
    handleUpdateDocument,
    handleDeleteDocument,
    fetchDocumentDetail,
    resetState,
  };
}