---
name: trade-api-token-agent
description: Use API Token to read and edit Trade records via /trade/* endpoints.
---

# Trade API Token Agent Skill

本 Skill 用于外部 Agent（如 OpenClaw/Codex/自建 Bot）通过 `tc_` API Token 调用交易接口，完成：

- 查询交易信息
- 编辑交易信息（PATCH）

> 只允许 `/trade/*` 路径；删除接口不可用。

## 1) 准备

- Base URL（生产示例）：`https://k6o6esmzl5.execute-api.ap-southeast-1.amazonaws.com/prod/`
- API Token：`tc_xxx...`
- Header：`Authorization: Bearer tc_xxx`

```bash
export API_BASE="https://k6o6esmzl5.execute-api.ap-southeast-1.amazonaws.com/prod/"
export API_TOKEN="tc_xxx_your_token"
```

## 2) 查询单条交易

```bash
curl -sS "${API_BASE}trade/<transactionId>" \
  -H "Authorization: Bearer ${API_TOKEN}" \
  -H "Content-Type: application/json"
```

## 3) 查询交易列表（分页）

```bash
curl -sS "${API_BASE}trade/list" \
  -X POST \
  -H "Authorization: Bearer ${API_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"page":1,"limit":20}'
```

## 4) 编辑交易（PATCH）

```bash
curl -sS "${API_BASE}trade/<transactionId>" \
  -X PATCH \
  -H "Authorization: Bearer ${API_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "remarks": "由外部Agent更新备注",
    "lessonsLearned": "严格执行计划",
    "tradeTags": ["AI", "复盘"]
  }'
```

## 5) 图片相关（如需）

### 获取上传 URL（trade 域）

```bash
curl -sS "${API_BASE}trade/image/upload-url" \
  -X POST \
  -H "Authorization: Bearer ${API_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "transactionId":"<transactionId>",
    "fileName":"chart.png",
    "fileType":"image/png",
    "date":"2026-02-11",
    "contentLength":123456,
    "source":"trade"
  }'
```

### 解析图片 key 为短时 URL

```bash
curl -sS "${API_BASE}trade/image/resolve" \
  -X POST \
  -H "Authorization: Bearer ${API_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"refs":["uploads/<userId>/<transactionId>/2026-02-11/a.png"]}'
```

## 6) 约束

- 仅 `/trade/*` 可访问
- `DELETE /trade/:transactionId` 会被拒绝
- 上传时 `transactionId` 必填且必须属于 token 所属用户
- 建议对 429（限流/配额）做重试退避
