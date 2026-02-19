---
name: trade-api-token-agent
description: Use API Token to read, create, and edit Trade records via /trade/* endpoints.
---

# Trade API Token Agent Skill (Single-file, Full Contract)

> Source of truth: `trade-backend/src/modules/trade/entities/trade.entity.ts`

本文件包含：
1) 字段语义（可编辑字段 + 含义）
2) 机器编排 JSON（MACHINE_JSON）
3) 严格 schema（STRICT_SCHEMA_JSON）

机器端只需下载这一个文件。

## Runtime Origin URL Strategy

```js
const skillUrl = new URL('/downloads/trade-api-token-agent-SKILL.md', window.location.origin).toString();
```

---

## Field Dictionary (Editable + Meaning)

### A. Create required fields（创建必填）

- `tradeType: "模拟交易" | "真实交易"`：交易类型
- `status: "已分析" | "待入场" | "已入场" | "已离场" | "提前离场"`：交易状态
- `tradeSubject: string`：交易标的（如 BTC/USDC）
- `marketStructure: "震荡" | "趋势" | "暂无法判断" | "停止" | "转换"`：市场结构判断
- `marketStructureAnalysis: string`：市场结构分析正文
- `entryPlanA: EntryPlan`：主入场计划（A计划）

### B. Frequently edited fields（常编辑字段）

- `analysisTime: string`：分析时间（ISO）
- `analysisPeriod: string`：分析周期（如 15分钟）
- `grade: "高" | "中" | "低"`：交易分级
- `analysisExpired: boolean`：分析是否过期
- `entryDirection: "多" | "空"`：入场方向
- `entryPrice/stopLoss/takeProfit: number`：入场/风控价格
- `exitPrice/exitTime: number|string`：离场价格与时间
- `tradeResult: "盈利" | "亏损" | "保本"`：结果
- `remarks: string`：备注
- `lessonsLearned: string`：经验总结
- `tradeTags: string[]`：标签
- `followedPlan: boolean`：是否按计划执行
- `followedSystemStrictly: boolean`：是否严格遵循系统
- `exitType: "TP" | "SL" | "MANUAL" | "TIME" | "FORCED"`
- `exitQualityTag: "TECHNICAL" | "EMOTIONAL" | "SYSTEM" | "UNKNOWN"`

### C. Image-related editable fields（图片字段）

- `volumeProfileImages: ImageResource[]`
- `marketStructureAnalysisImages: MarketStructureAnalysisImage[]`
- `trendAnalysisImages: MarketStructureAnalysisImage[]`
- `expectedPathImages / expectedPathImagesDetailed`
- `entryAnalysisImages / entryAnalysisImagesDetailed`
- `actualPathImages / actualPathImagesDetailed`
- `analysisImages / analysisImagesDetailed`

### D. Server-controlled fields（禁止客户端写入）

- `userId`
- `createdAt`, `updatedAt`
- `isShareable`, `shareId`
- `tradeShortId`
- R自动计算字段：
  - `plannedRiskPerUnit`
  - `plannedRewardPerUnit`
  - `plannedRR`
  - `realizedR`
  - `rEfficiency`
  - `exitDeviationR`

---

---

## API Token Image Download Workflow (Copy-ready)

### 1) Get trade detail

```bash
curl -X GET "https://<YOUR_API_BASE>/trade/<transactionId>"   -H "Authorization: Bearer tc_xxx"
```

从返回里提取图片 refs/keys（例如 `marketStructureAnalysisImages[*].key`）。

### 2) Resolve refs to short-lived URLs

```bash
curl -X POST "https://<YOUR_API_BASE>/trade/image/resolve"   -H "Authorization: Bearer tc_xxx"   -H "Content-Type: application/json"   -d '{
    "transactionId": "<transactionId>",
    "refs": ["uploads/<userId>/<transactionId>/2026-02-19/xxx.png"]
  }'
```

返回 `items[].url` 为短时签名 URL（默认约 300s）。

### 3) Download image

```bash
curl -L "<signedUrlFromResolve>" -o trade-image.png
```



### JavaScript (fetch) snippet

```js
const apiBase = "https://<YOUR_API_BASE>";
const token = "tc_xxx";
const transactionId = "<transactionId>";

const tradeRes = await fetch(`${apiBase}/trade/${transactionId}`, {
  headers: { Authorization: `Bearer ${token}` },
});
const tradeJson = await tradeRes.json();

const refs = (tradeJson?.data?.marketStructureAnalysisImages || [])
  .map((x) => x?.key)
  .filter(Boolean);

const resolveRes = await fetch(`${apiBase}/trade/image/resolve`, {
  method: "POST",
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ transactionId, refs }),
});
const resolveJson = await resolveRes.json();

const firstUrl = resolveJson?.data?.items?.[0]?.url || resolveJson?.items?.[0]?.url;
if (!firstUrl) throw new Error("no downloadable image url");

const fileRes = await fetch(firstUrl);
const blob = await fileRes.blob();
console.log("downloaded bytes:", blob.size);
```

### Common errors

- `401`：token 无效/过期
- `403`：越权（非 `/trade/*` 或非本人图片）
- `429`：配额/限流触发
- `400`：参数不完整（常见：缺 transactionId）

---

## MACHINE_JSON

```json
{
  "name": "trade-api-token-agent",
  "contractVersion": "2.1.0",
  "schemaRef": "urn:trade-api-token-agent:schema:2.1.0",
  "sourceOfTruth": "trade-backend/src/modules/trade/entities/trade.entity.ts",
  "responseEnvelope": {
    "successField": "success",
    "messageField": "message",
    "dataField": "data"
  },
  "runtimeUrlStrategy": {
    "mode": "origin-relative",
    "skillPath": "/downloads/trade-api-token-agent-SKILL.md"
  },
  "auth": {
    "type": "bearer",
    "header": "Authorization",
    "format": "Bearer tc_<token>"
  },
  "endpoints": [
    { "id": "getTrade", "method": "GET", "path": "/trade/{transactionId}" },
    { "id": "listTrades", "method": "POST", "path": "/trade/list" },
    { "id": "createTrade", "method": "POST", "path": "/trade" },
    { "id": "patchTrade", "method": "PATCH", "path": "/trade/{transactionId}" },
    { "id": "tradeImageUploadUrl", "method": "POST", "path": "/trade/image/upload-url" },
    { "id": "tradeImageResolve", "method": "POST", "path": "/trade/image/resolve" }
  ],
  "createRequired": [
    "tradeType", "status", "tradeSubject", "marketStructure", "marketStructureAnalysis", "entryPlanA"
  ],
  "serverControlled": [
    "userId", "createdAt", "updatedAt", "isShareable", "shareId", "tradeShortId",
    "plannedRiskPerUnit", "plannedRewardPerUnit", "plannedRR", "realizedR", "rEfficiency", "exitDeviationR"
  ]
}
```

## STRICT_SCHEMA_JSON

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "urn:trade-api-token-agent:schema:2.1.0",
  "title": "Trade API Token Agent Strict Contract v2.1",
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
        "tradeSubject": { "type": "string", "minLength": 1 },
        "marketStructure": { "type": "string", "enum": ["震荡", "趋势", "暂无法判断", "停止", "转换"] },
        "marketStructureAnalysis": { "type": "string" },
        "entryPlanA": {
          "type": "object",
          "properties": {
            "entryReason": { "type": "string" },
            "entrySignal": { "type": "string" },
            "exitSignal": { "type": "string" }
          },
          "additionalProperties": false
        }
      },
      "additionalProperties": true
    },
    "patchPayload": {
      "type": "object",
      "additionalProperties": true
    }
  },
  "additionalProperties": false
}
```
