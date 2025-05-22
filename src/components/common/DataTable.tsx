import * as React from 'react';
import {
  ColumnDef,
  SortingState,
  VisibilityState,
  RowSelectionState,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  Table as ReactTable, // Alias to avoid naming conflict
} from '@tanstack/react-table';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ChevronDown } from 'lucide-react';

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
  onPageChange: (page: number) => void; // Expects 1-indexed page
  onPageSizeChange: (pageSize: number) => void;

  // Sorting state and callback
  sorting: SortingState;
  onSortingChange: React.Dispatch<React.SetStateAction<SortingState>>;

  // Column Visibility
  columnVisibility: VisibilityState;
  onColumnVisibilityChange: React.Dispatch<React.SetStateAction<VisibilityState>>;

  // Row Selection
  rowSelection: RowSelectionState;
  onRowSelectionChange: React.Dispatch<React.SetStateAction<RowSelectionState>>;

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
  columnVisibility,
  onColumnVisibilityChange,
  rowSelection,
  onRowSelectionChange,
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
      columnVisibility,
      rowSelection,
      pagination: {
        pageIndex: page - 1, // Convert 1-indexed to 0-indexed for react-table
        pageSize,
      },
    },
    onSortingChange,
    onColumnVisibilityChange,
    onRowSelectionChange,
    onPaginationChange: (updater) => {
      if (typeof updater === 'function') {
        const newState = updater({
          pageIndex: page - 1,
          pageSize,
        });
        onPageChange(newState.pageIndex + 1);
        onPageSizeChange(newState.pageSize);
      } else {
        onPageChange(updater.pageIndex + 1);
        onPageSizeChange(updater.pageSize);
      }
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    // enableRowSelection: true, // enable if you want row selection checkboxes by default for all rows
    // getRowId: (row) => (row as any).id, // Adjust if your data has a unique ID other than 'id'
  });

  return (
    <div>
      {/* Toolbar Slot & Column Visibility */} 
      <div className="flex items-center py-4">
        {toolbarSlot}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="ml-auto">
              列显示 <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => {
                return (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) =>
                      column.toggleVisibility(!!value)
                    }
                  >
                    {/* You might want a more sophisticated way to get display names */} 
                    {typeof column.columnDef.header === 'string' ? column.columnDef.header : column.id}
                  </DropdownMenuCheckboxItem>
                );
              })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Table */} 
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
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
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  {loading ? "加载中..." : "暂无数据"}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Controls */} 
      <div className="flex items-center justify-between space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          {table.getFilteredSelectedRowModel().rows.length} /{" "}
          {table.getFilteredRowModel().rows.length} 行已选择。
          总共 {totalItems} 条数据。
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            上一页
          </Button>
          <span className="mx-2 text-sm">
            第 {page} / {totalPages} 页
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            下一页
          </Button>
          <select
            className="border p-1 rounded ml-2 text-sm"
            value={pageSize}
            onChange={(e) => {
              const newSize = Number(e.target.value);
              onPageSizeChange(newSize); // Callback to parent
              table.setPageSize(newSize); // Update table instance
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
