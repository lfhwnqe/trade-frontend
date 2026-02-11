---
name: trade-api-token-agent
description: Use API Token to read, create, and edit Trade records via /trade/* endpoints.
---

# Trade API Token Agent Skill (Single-file, Full Contract)

Source of truth: `trade-backend/src/modules/trade/entities/trade.entity.ts`

## Runtime Origin URL Strategy

```js
const skillUrl = new URL('/downloads/trade-api-token-agent-SKILL.md', window.location.origin).toString();
```

## Field Dictionary

Create required:
- tradeType（交易类型）
- status（交易状态）
- tradeSubject（交易标的）
- marketStructure（市场结构）
- marketStructureAnalysis（市场结构分析）
- entryPlanA（主入场计划）

Server-controlled（禁止写）:
- userId, createdAt, updatedAt, isShareable, shareId, tradeShortId
- plannedRiskPerUnit, plannedRewardPerUnit, plannedRR, realizedR, rEfficiency, exitDeviationR

## MACHINE_JSON

```json
{
  "name": "trade-api-token-agent",
  "contractVersion": "2.1.0",
  "schemaRef": "urn:trade-api-token-agent:schema:2.1.0",
  "sourceOfTruth": "trade-backend/src/modules/trade/entities/trade.entity.ts",
  "runtimeUrlStrategy": { "mode": "origin-relative", "skillPath": "/downloads/trade-api-token-agent-SKILL.md" },
  "endpoints": [
    { "id": "getTrade", "method": "GET", "path": "/trade/{transactionId}" },
    { "id": "listTrades", "method": "POST", "path": "/trade/list" },
    { "id": "createTrade", "method": "POST", "path": "/trade" },
    { "id": "patchTrade", "method": "PATCH", "path": "/trade/{transactionId}" }
  ]
}
```

## STRICT_SCHEMA_JSON

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "urn:trade-api-token-agent:schema:2.1.0",
  "type": "object",
  "required": ["version", "createPayload", "patchPayload"],
  "properties": {
    "version": { "type": "string", "const": "2.1.0" },
    "createPayload": {
      "type": "object",
      "required": ["tradeType", "status", "tradeSubject", "marketStructure", "marketStructureAnalysis", "entryPlanA"],
      "properties": {
        "tradeType": { "type": "string", "enum": ["模拟交易", "真实交易"] },
        "status": { "type": "string", "enum": ["已分析", "待入场", "已入场", "已离场", "提前离场"] },
        "tradeSubject": { "type": "string" },
        "marketStructure": { "type": "string", "enum": ["震荡", "趋势", "暂无法判断", "停止", "转换"] },
        "marketStructureAnalysis": { "type": "string" },
        "entryPlanA": { "type": "object", "additionalProperties": false }
      },
      "additionalProperties": true
    },
    "patchPayload": { "type": "object", "additionalProperties": true }
  },
  "additionalProperties": false
}
```
