import { Card, CardContent, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  FileText, 
  CheckCircle, 
  Clock, 
  AlertCircle 
} from 'lucide-react';
import { DocumentEntity, DocumentStatus } from '../../types';

interface DocumentStatsProps {
  documents: DocumentEntity[];
  loading: boolean;
}

export function DocumentStats({ documents, loading }: DocumentStatsProps) {
  // 计算统计数据
  const stats = {
    total: documents.length,
    completed: documents.filter(doc => doc.status === DocumentStatus.COMPLETED).length,
    processing: documents.filter(doc => doc.status === DocumentStatus.PROCESSING).length,
    failed: documents.filter(doc => doc.status === DocumentStatus.FAILED).length,
  };

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <div className="space-y-3">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-3 w-32" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="pt-6">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总文档数</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="text-2xl font-bold">{stats.total}</div>
          <p className="text-xs text-muted-foreground">
            当前列表中的文档总数
          </p>
        </CardContent>
      </Card>
      
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="pt-6">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">已完成</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </div>
          <div className="text-2xl font-bold text-green-600">
            {stats.completed}
          </div>
          <p className="text-xs text-muted-foreground">
            已完成向量化处理
          </p>
        </CardContent>
      </Card>

      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="pt-6">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">处理中</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-blue-600">
            {stats.processing}
          </div>
          <p className="text-xs text-muted-foreground">
            正在处理的文档
          </p>
        </CardContent>
      </Card>

      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="pt-6">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">处理失败</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </div>
          <div className="text-2xl font-bold text-red-600">
            {stats.failed}
          </div>
          <p className="text-xs text-muted-foreground">
            处理失败的文档
          </p>
        </CardContent>
      </Card>
    </div>
  );
}