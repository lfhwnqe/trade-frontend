---
name: trade-api-token-agent
description: Use API Token to read and edit Trade records via /trade/* endpoints.
---

# Trade API Token Agent Skill

本 Skill 用于外部 Agent 通过 `tc_` API Token 调用交易接口，完成查询和编辑。

## 0) 统一响应协议

成功：
```json
{ "success": true, "message": "可选", "data": {} }
```

失败：
```json
{ "success": false, "message": "错误信息", "errorCode": "可选", "details": {} }
```

Agent 解析顺序：HTTP 2xx -> success=true -> 读取 data。

## 1) 认证

```bash
export API_BASE="https://k6o6esmzl5.execute-api.ap-southeast-1.amazonaws.com/prod/"
export API_TOKEN="tc_xxx_your_token"
```

Header: `Authorization: Bearer ${API_TOKEN}`

## 2) 查询单条交易

```bash
curl -sS "${API_BASE}trade/<transactionId>" \
  -H "Authorization: Bearer ${API_TOKEN}" \
  -H "Content-Type: application/json"
```

示例返回：
```json
{
  "success": true,
  "data": {
    "transactionId": "925bb36e-...",
    "tradeShortId": "tr_MrTtgM89",
    "tradeSubject": "BTC/USDC",
    "status": "已分析",
    "updatedAt": "2026-02-11T08:00:00.000Z"
  }
}
```

## 3) 查询列表

```bash
curl -sS "${API_BASE}trade/list" \
  -X POST \
  -H "Authorization: Bearer ${API_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"page":1,"limit":20}'
```

## 4) 编辑交易

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

示例返回：
```json
{
  "success": true,
  "message": "更新成功",
  "data": {
    "transactionId": "925bb36e-...",
    "updatedAt": "2026-02-11T09:00:00.000Z"
  }
}
```

## 5) 图片接口（可选）

### 5.1 上传URL
```bash
curl -sS "${API_BASE}trade/image/upload-url" -X POST \
  -H "Authorization: Bearer ${API_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"transactionId":"<id>","fileName":"chart.png","fileType":"image/png","date":"2026-02-11","contentLength":123456,"source":"trade"}'
```

### 5.2 解析图片key
```bash
curl -sS "${API_BASE}trade/image/resolve" -X POST \
  -H "Authorization: Bearer ${API_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"refs":["uploads/<userId>/<transactionId>/2026-02-11/a.png"]}'
```

## 6) 错误码处理

- 400 参数错误
- 401 token 无效
- 403 越权
- 404 不存在
- 429 限流/配额
- 5xx 服务端错误（建议重试）
