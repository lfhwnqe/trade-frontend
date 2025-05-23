import { useAtom } from 'jotai';
import { atomWithImmer } from 'jotai-immer';
import { Draft } from 'immer';
import { useCallback } from 'react';

/**
 * 使用 jotai 和 jotai-immer 封装的 hook，用于状态管理
 * 避免无效渲染，提供类似 useState 的 API 但具有 immer 的能力
 * 
 * @param atom jotai atom
 * @returns [state, setState, resetState] 类似 useState 的 API
 */
export function useAtomImmer<T>(atom: ReturnType<typeof atomWithImmer<T>>) {
  const [state, setState] = useAtom(atom);

  // 使用 immer 的方式更新状态
  const updateState = useCallback((updater: ((draft: Draft<T>) => void) | T) => {
    if (typeof updater === 'function') {
      setState(updater as (draft: Draft<T>) => void);
    } else {
      setState(() => updater);
    }
  }, [setState]);

  // 重置状态到初始值
  const resetState = useCallback((initialValue: T) => {
    setState(() => initialValue);
  }, [setState]);

  return [state, updateState, resetState] as const;
}

/**
 * 创建一个 immer atom
 * 
 * @param initialValue 初始值
 * @returns atomWithImmer 实例
 */
export function createImmerAtom<T>(initialValue: T) {
  return atomWithImmer<T>(initialValue);
}
