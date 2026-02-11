---
name: trade-api-token-agent
description: Use API Token to read, create, and edit Trade records via /trade/* endpoints.
---

# Trade API Token Agent Skill (Single-file)

本文件内嵌 MACHINE_JSON + STRICT_SCHEMA_JSON，机器只需下载这一个文件。

## Runtime Origin URL Strategy

```js
const skillUrl = new URL('/downloads/trade-api-token-agent-SKILL.md', window.location.origin).toString();
```

## MACHINE_JSON

```json
{
  "name": "trade-api-token-agent",
  "contractVersion": "2.0.0",
  "schemaRef": "urn:trade-api-token-agent:schema:2.0.0",
  "breakingChangeSince": "1.1.0",
  "runtimeUrlStrategy": {
    "mode": "origin-relative",
    "skillPath": "/downloads/trade-api-token-agent-SKILL.md"
  },
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
  "$id": "urn:trade-api-token-agent:schema:2.0.0",
  "type": "object",
  "required": ["version", "createPayload", "patchPayload"],
  "properties": {
    "version": { "type": "string", "const": "2.0.0" },
    "createPayload": {
      "type": "object",
      "required": ["tradeType", "status", "tradeSubject", "marketStructure", "marketStructureAnalysis", "entryPlanA"],
      "properties": {
        "tradeType": { "type": "string", "enum": ["模拟交易", "真实交易"] },
        "status": { "type": "string", "enum": ["已分析", "待入场", "已入场", "已离场", "提前离场"] },
        "tradeSubject": { "type": "string" },
        "marketStructure": { "type": "string", "enum": ["震荡", "趋势", "暂无法判断", "停止", "转换"] },
        "marketStructureAnalysis": { "type": "string" },
        "entryPlanA": { "type": "object", "additionalProperties": true }
      },
      "additionalProperties": true
    },
    "patchPayload": { "type": "object", "additionalProperties": true }
  },
  "additionalProperties": false
}
```
