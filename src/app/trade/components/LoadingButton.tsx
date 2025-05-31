"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Trade } from "../config";

interface LoadingButtonProps {
  loading: boolean;
  editTrade?: Trade | null;
  errors?: Record<string, unknown>;
  className?: string;
  onSubmit?: () => void; // 添加 onSubmit 属性，用于接收外部传入的提交方法
}

export function LoadingButton({
  loading,
  editTrade,
  errors = {},
  className,
  onSubmit,
}: LoadingButtonProps) {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (onSubmit) {
      e.preventDefault();
      onSubmit();
    }
  };

  return (
    <Button 
      type={onSubmit ? "button" : "submit"} 
      disabled={loading} 
      className={`relative ${className || ''}`}
      onClick={onSubmit ? handleClick : undefined}>
      {Object.keys(errors).length > 0 && (
        <span className="absolute -top-1 -right-1 flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-destructive"></span>
        </span>
      )}
      {loading ? (
        <>
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          处理中...
        </>
      ) : editTrade?.transactionId ? (
        "保存更改"
      ) : (
        "创建记录"
      )}
    </Button>
  );
}
