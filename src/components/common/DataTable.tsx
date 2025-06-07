import * as React from 'react';
import {
  ColumnDef,
  SortingState,
  RowSelectionState,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  loading: boolean;

  // Pagination state from parent
  page: number; // Current page (1-indexed)
  pageSize: number;
  totalItems: number;
  totalPages: number;

  // Callbacks to parent to update state and re-fetch
  onPageChange: (page: number, pageSize?: number) => void; // Expects 1-indexed page
  onPageSizeChange: (page: number, pageSize: number) => void;

  // Sorting state and callback
  sorting: SortingState;
  onSortingChange: React.Dispatch<React.SetStateAction<SortingState>>;

  // Row Selection
  rowSelection: RowSelectionState;
  onRowSelectionChange: React.Dispatch<React.SetStateAction<RowSelectionState>>;

  // Column Pinning
  initialColumnPinning?: {
    left?: string[];
    right?: string[];
  };

  // Optional: Slot for table toolbar (e.g., global filter, additional actions)
  toolbarSlot?: React.ReactNode;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  loading,
  page,
  pageSize,
  totalItems,
  totalPages,
  onPageChange,
  onPageSizeChange,
  sorting,
  onSortingChange,
  rowSelection,
  onRowSelectionChange,
  initialColumnPinning,
  toolbarSlot,
}: DataTableProps<TData, TValue>) {
  const table = useReactTable({
    data,
    columns,
    manualPagination: true,
    manualSorting: true, // Assuming sorting is handled server-side via onSortingChange
    pageCount: totalPages,
    state: {
      sorting,
      rowSelection,
      pagination: {
        pageIndex: page - 1, // Convert 1-indexed to 0-indexed for react-table
        pageSize,
      },
      columnPinning: initialColumnPinning || {},
    },
    onSortingChange,
    onRowSelectionChange,
    onPaginationChange: (updater) => {
      if (typeof updater === 'function') {
        const newState = updater({
          pageIndex: page - 1,
          pageSize,
        });
        onPageChange(newState.pageIndex + 1, newState.pageSize);
        if (newState.pageSize !== pageSize) {
          onPageSizeChange(1, newState.pageSize); // 改变每页大小时回到第一页
        }
      } else {
        onPageChange(updater.pageIndex + 1, updater.pageSize);
        if (updater.pageSize !== pageSize) {
          onPageSizeChange(1, updater.pageSize); // 改变每页大小时回到第一页
        }
      }
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    // 启用列固定功能
    enableColumnPinning: true,
    initialState: {
      columnPinning: initialColumnPinning || {},
    },
  });

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar Slot */}
      {toolbarSlot && (
        <div className="flex items-center py-4 flex-shrink-0">
          {toolbarSlot}
        </div>
      )}

      {/* Table Container - 可滚动区域 */}
      <div className="flex-1 min-h-0">
        <div className={`rounded-md border relative h-full ${loading ? 'opacity-50 pointer-events-none' : ''}`}>
          {/* 横向和纵向都可滚动的表格容器，支持固定列 */}
          <div className="overflow-auto h-full relative">
            <Table className="min-w-max">
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => {
                      const isPinned = header.column.getIsPinned();
                      return (
                        <TableHead
                          key={header.id}
                          className={`whitespace-nowrap ${
                            isPinned === 'right'
                              ? 'sticky right-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-l border-border z-10'
                              : ''
                          }`}
                          style={{
                            ...(isPinned === 'right' && {
                              right: 0,
                            }),
                          }}
                        >
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                        </TableHead>
                      );
                    })}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {loading && table.getRowModel().rows?.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className="h-24 text-center"
                    >
                      <div className="flex items-center justify-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                        <span>加载中...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow
                      key={row.id}
                      data-state={row.getIsSelected() && 'selected'}
                    >
                      {row.getVisibleCells().map((cell) => {
                        const isPinned = cell.column.getIsPinned();
                        return (
                          <TableCell
                            key={cell.id}
                            className={`whitespace-nowrap ${
                              isPinned === 'right'
                                ? 'sticky right-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-l border-border z-10'
                                : ''
                            }`}
                            style={{
                              ...(isPinned === 'right' && {
                                right: 0,
                              }),
                            }}
                          >
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext()
                            )}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className="h-24 text-center"
                    >
                      暂无数据
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Loading overlay for existing data */}
          {loading && table.getRowModel().rows?.length > 0 && (
            <div className="absolute inset-0 bg-background/50 flex items-center justify-center">
              <div className="flex items-center space-x-2 bg-background px-4 py-2 rounded-md shadow-md">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                <span className="text-sm">正在加载...</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Pagination Controls - 固定在底部 */}
      <div className="flex items-center justify-between space-x-2 py-4 flex-shrink-0 border-t bg-background">
        <div className="flex-1 text-sm text-muted-foreground">
          {table.getFilteredSelectedRowModel().rows.length} /{" "}
          {table.getFilteredRowModel().rows.length} 行已选择。
          总共 {totalItems} 条数据。
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (page > 1) {
                onPageChange(page - 1, pageSize);
              }
            }}
            disabled={page <= 1 || loading}
          >
            上一页
          </Button>
          <span className="mx-2 text-sm">
            第 {page} / {totalPages} 页
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (page < totalPages) {
                onPageChange(page + 1, pageSize);
              }
            }}
            disabled={page >= totalPages || loading}
          >
            下一页
          </Button>
          <select
            className="border p-1 rounded ml-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            value={pageSize}
            disabled={loading}
            onChange={(e) => {
              const newSize = Number(e.target.value);
              onPageSizeChange(1, newSize);
            }}
          >
            {[10, 20, 50, 100].map((sz) => (
              <option key={sz} value={sz}>
                {sz}条/页
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
