import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { CalendarIcon, X, Filter } from 'lucide-react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { DocumentStatus, DocumentType, DateRange } from '../../types';
import { getDocumentStatusText, getDocumentTypeText } from '../../request';

interface SimpleFilters {
  status?: DocumentStatus | 'all';
  documentType?: DocumentType | 'all';
  dateRange?: DateRange;
}

interface SimpleFilterProps {
  filters: SimpleFilters;
  onFiltersChange: (filters: SimpleFilters) => void;
  loading: boolean;
}

export function SimpleFilter({ filters, onFiltersChange, loading }: SimpleFilterProps) {
  const hasActiveFilters = filters.status || filters.documentType || filters.dateRange;

  const handleStatusChange = (value: string) => {
    onFiltersChange({
      ...filters,
      status: value === 'all' ? undefined : value as DocumentStatus,
    });
  };

  const handleTypeChange = (value: string) => {
    onFiltersChange({
      ...filters,
      documentType: value === 'all' ? undefined : value as DocumentType,
    });
  };

  const handleDateRangeChange = (range: { from?: Date; to?: Date } | undefined) => {
    if (!range || !range.from) {
      onFiltersChange({
        ...filters,
        dateRange: undefined,
      });
      return;
    }

    onFiltersChange({
      ...filters,
      dateRange: {
        from: range.from.toISOString(),
        to: range.to ? range.to.toISOString() : range.from.toISOString(),
      },
    });
  };

  const clearFilters = () => {
    onFiltersChange({});
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-col space-y-4">
          {/* 筛选标题 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              <span className="font-medium">筛选条件</span>
              {hasActiveFilters && (
                <Badge variant="secondary">
                  {[filters.status, filters.documentType, filters.dateRange].filter(Boolean).length} 个筛选
                </Badge>
              )}
            </div>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="h-4 w-4 mr-1" />
                清除
              </Button>
            )}
          </div>

          {/* 筛选控件 */}
          <div className="flex flex-wrap gap-4">
            {/* 状态筛选 */}
            <div className="min-w-[150px]">
              <Select
                value={filters.status || 'all'}
                onValueChange={handleStatusChange}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择状态" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">所有状态</SelectItem>
                  <SelectItem value={DocumentStatus.COMPLETED}>
                    {getDocumentStatusText(DocumentStatus.COMPLETED)}
                  </SelectItem>
                  <SelectItem value={DocumentStatus.PROCESSING}>
                    {getDocumentStatusText(DocumentStatus.PROCESSING)}
                  </SelectItem>
                  <SelectItem value={DocumentStatus.FAILED}>
                    {getDocumentStatusText(DocumentStatus.FAILED)}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 类型筛选 */}
            <div className="min-w-[150px]">
              <Select
                value={filters.documentType || 'all'}
                onValueChange={handleTypeChange}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择类型" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">所有类型</SelectItem>
                  <SelectItem value={DocumentType.KNOWLEDGE}>
                    {getDocumentTypeText(DocumentType.KNOWLEDGE)}
                  </SelectItem>
                  <SelectItem value={DocumentType.TRADE}>
                    {getDocumentTypeText(DocumentType.TRADE)}
                  </SelectItem>
                  <SelectItem value={DocumentType.MANUAL}>
                    {getDocumentTypeText(DocumentType.MANUAL)}
                  </SelectItem>
                  <SelectItem value={DocumentType.REPORT}>
                    {getDocumentTypeText(DocumentType.REPORT)}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 日期范围筛选 */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="min-w-[200px] justify-start text-left font-normal"
                  disabled={loading}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {filters.dateRange?.from ? (
                    filters.dateRange.to && filters.dateRange.from !== filters.dateRange.to ? (
                      <>
                        {format(new Date(filters.dateRange.from), "PPP", { locale: zhCN })} -{" "}
                        {format(new Date(filters.dateRange.to), "PPP", { locale: zhCN })}
                      </>
                    ) : (
                      format(new Date(filters.dateRange.from), "PPP", { locale: zhCN })
                    )
                  ) : (
                    <span>选择日期范围</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={filters.dateRange?.from ? new Date(filters.dateRange.from) : undefined}
                  selected={{
                    from: filters.dateRange?.from ? new Date(filters.dateRange.from) : undefined,
                    to: filters.dateRange?.to ? new Date(filters.dateRange.to) : undefined,
                  }}
                  onSelect={handleDateRangeChange}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}