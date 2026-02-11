---
name: trade-api-token-agent
description: Use API Token to read/edit/create Trade records via /trade/* endpoints.
---

# Trade API Token Agent Skill

机器可读契约：`trade-api-token-agent.machine.json`

## Source of Truth

字段定义来自：`trade-backend/src/modules/trade/entities/trade.entity.ts`

## Agent 必读字段约定

- `createRequired`：新建必须提供
- `createOptional`：新建可选
- `serverControlled`：服务端控制，不应由 Agent 写入

## 标准响应

成功：
```json
{ "success": true, "message": "可选", "data": {} }
```

失败：
```json
{ "success": false, "message": "错误信息", "errorCode": "可选", "details": {} }
```

## 最小流程

1. GET `/trade/{transactionId}`
2. PATCH `/trade/{transactionId}`（按需字段）
3. POST `/trade`（至少提供 createRequired）

## 示例

```bash
curl -sS "${API_BASE}trade/<transactionId>" \
  -H "Authorization: Bearer ${API_TOKEN}" \
  -H "Content-Type: application/json"
```

```bash
curl -sS "${API_BASE}trade/<transactionId>" \
  -X PATCH \
  -H "Authorization: Bearer ${API_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"remarks":"更新备注"}'
```

```bash
curl -sS "${API_BASE}trade" \
  -X POST \
  -H "Authorization: Bearer ${API_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "tradeType":"模拟交易",
    "status":"已分析",
    "tradeSubject":"BTC/USDC",
    "marketStructure":"震荡",
    "marketStructureAnalysis":"结构尚可",
    "entryPlanA":{"entryReason":"...","entrySignal":"...","exitSignal":"..."}
  }'
```
