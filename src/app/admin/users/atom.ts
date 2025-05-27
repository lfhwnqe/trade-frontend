// 用户管理页面的 jotai atoms 封装
import { createImmerAtom } from "@/hooks/useAtomImmer";

// 用户列表
export const usersAtom = createImmerAtom<User[]>([]);

// 下一页 Token
export const nextTokenAtom = createImmerAtom<string | undefined>(undefined);

// 用户加载中
export const isLoadingAtom = createImmerAtom(false);

// 用户加载错误信息
export const errorAtom = createImmerAtom("");

// 是否加载更多中
export const isLoadingMoreAtom = createImmerAtom(false);

// 注册开关
export const regOpenAtom = createImmerAtom<boolean | null>(null);

// 注册开关状态切换中
export const regChangingAtom = createImmerAtom(false);

// 注册开关操作报错
export const regOpErrorAtom = createImmerAtom("");

export interface UserAttribute {
  Name: string;
  Value: string;
}

export interface User {
  userId: string;
  attributes: UserAttribute[];
  enabled: boolean;
  userStatus: string;
  createdAt: string;
  lastModifiedAt: string;
}

export interface ListUsersResponse {
  users: User[];
  nextToken?: string;
}
