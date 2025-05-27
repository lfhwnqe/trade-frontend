'use client';
import { Suspense } from 'react';
import VerifyPage from './suspense';

export default function PageWrapper() {
  return (
    <Suspense fallback={<div>页面加载中...</div>}>
      <VerifyPage />
    </Suspense>
  );
}