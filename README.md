# Trade Frontend

交易记录系统的前端（Next.js App Router）。负责：交易录入/编辑、列表筛选、仪表盘展示、管理后台等。

相关总览文档见仓库根目录：`../README.md` 与 `../docs/`。

## 技术栈

- Next.js 15（App Router）
- React 19
- TailwindCSS + Radix UI
- 状态管理：Jotai

## 本地开发

```bash
cd trade-frontend
pnpm i  # 或 yarn
pnpm dev

# http://localhost:3000
```

## 目录结构（关键位置）

- `src/app/trade/*`：交易相关页面
- `src/app/admin/*`：管理相关页面
- `src/utils/fetchWithAuth.ts`：统一 fetch 封装（401 自动跳转登录并保存回跳地址）
- `src/app/trade/config.ts`：交易表单枚举/类型定义（需要与后端 DTO 同步）

## 与后端联调

- 后端 Swagger（本地）：`http://localhost:7800/api/docs`
- 环境变量清单：见 `../docs/env.md`

> 建议：后续做一个脚本/CI 检查 `config.ts` 与后端 DTO 枚举/字段是否一致，避免“前后端字段漂移”。
