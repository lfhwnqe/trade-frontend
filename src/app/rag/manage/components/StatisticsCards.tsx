"use client";

import * as React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { 
  FileText, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  TrendingUp,
  Database
} from "lucide-react";
import { DocumentEntity } from "../../types";
import { getDocumentStatusStats } from "../../atom";

interface StatisticsCardsProps {
  documents: DocumentEntity[];
  loading?: boolean;
}

export function StatisticsCards({ documents, loading = false }: StatisticsCardsProps) {
  const stats = getDocumentStatusStats(documents);

  const cards = [
    {
      title: "总文档数",
      value: stats.total,
      description: "知识库中的文档总数",
      icon: FileText,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "已完成",
      value: stats.completed,
      description: "已完成向量化的文档",
      icon: CheckCircle,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "处理中",
      value: stats.processing,
      description: "正在处理的文档",
      icon: Clock,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "处理失败",
      value: stats.failed,
      description: "处理失败的文档",
      icon: AlertCircle,
      color: "text-red-600",
      bgColor: "bg-red-50",
    },
  ];

  // 计算成功率
  const successRate = stats.total > 0 ? ((stats.completed / stats.total) * 100).toFixed(1) : "0";

  return (
    <div className="space-y-4">
      {/* 主要统计卡片 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.title} className="relative overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                <div className={`${card.bgColor} p-2 rounded-lg`}>
                  <Icon className={`h-4 w-4 ${card.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${card.color}`}>
                  {loading ? (
                    <div className="animate-pulse bg-gray-200 h-8 w-16 rounded"></div>
                  ) : (
                    card.value
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {card.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* 额外统计信息 */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* 成功率卡片 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">处理成功率</CardTitle>
            <div className="bg-purple-50 p-2 rounded-lg">
              <TrendingUp className="h-4 w-4 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {loading ? (
                <div className="animate-pulse bg-gray-200 h-8 w-16 rounded"></div>
              ) : (
                `${successRate}%`
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              已完成文档占总文档的比例
            </p>
            
            {/* 进度条 */}
            {!loading && stats.total > 0 && (
              <div className="mt-3">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${successRate}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>0%</span>
                  <span>100%</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 存储统计 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">存储统计</CardTitle>
            <div className="bg-orange-50 p-2 rounded-lg">
              <Database className="h-4 w-4 text-orange-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {loading ? (
                <>
                  <div className="animate-pulse bg-gray-200 h-6 w-24 rounded"></div>
                  <div className="animate-pulse bg-gray-200 h-4 w-32 rounded"></div>
                </>
              ) : (
                <>
                  <div className="text-2xl font-bold text-orange-600">
                    {documents.reduce((total, doc) => total + (doc.chunkCount || 0), 0)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    总分块数量
                  </p>
                  <div className="text-sm text-muted-foreground">
                    总令牌数: {documents.reduce((total, doc) => total + (doc.totalTokens || 0), 0).toLocaleString()}
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 状态分布 */}
      {!loading && stats.total > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">状态分布</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { label: "已完成", value: stats.completed, color: "bg-green-500", total: stats.total },
                { label: "处理中", value: stats.processing, color: "bg-blue-500", total: stats.total },
                { label: "处理失败", value: stats.failed, color: "bg-red-500", total: stats.total },
              ].map((item) => {
                const percentage = stats.total > 0 ? (item.value / item.total) * 100 : 0;
                return (
                  <div key={item.label} className="flex items-center space-x-3">
                    <div className="w-16 text-sm text-muted-foreground">{item.label}</div>
                    <div className="flex-1">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`${item.color} h-2 rounded-full transition-all duration-300`}
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className="w-16 text-sm font-medium text-right">
                      {item.value} ({percentage.toFixed(1)}%)
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}