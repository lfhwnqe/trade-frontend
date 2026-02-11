---
name: trade-api-token-agent
description: Use API Token to create/update Trade records in trade-backend with strict field semantics, conditional required rules, and low-ambiguity payloads.
---

# Trade API Token Agent Skill

## 1) Skill Purpose

用于让 agent 根据行情分析，自动调用后端 Trade 模块接口来：
- 创建交易：`POST /trade`
- 更新交易：`PATCH /trade/:transactionId`

此 Skill 的目标是降低 AI 歧义：
- 明确每个字段真实含义
- 明确哪些字段该写、哪些字段不要写
- 明确状态驱动的条件必填

## 2) Backend Source Of Truth

- 模块入口：`/Users/linuo/codes/trade-codes/trade-backend/src/modules/trade/trade.module.ts`
- 控制器：`/Users/linuo/codes/trade-codes/trade-backend/src/modules/trade/trade.controller.ts`
- 服务实现：`/Users/linuo/codes/trade-codes/trade-backend/src/modules/trade/trade.service.ts`
- 创建 DTO：`/Users/linuo/codes/trade-codes/trade-backend/src/modules/trade/dto/create-trade.dto.ts`
- 更新 DTO：`/Users/linuo/codes/trade-codes/trade-backend/src/modules/trade/dto/update-trade.dto.ts`
- 实体定义：`/Users/linuo/codes/trade-codes/trade-backend/src/modules/trade/entities/trade.entity.ts`
- 鉴权中间件（API token 规则）：`/Users/linuo/codes/trade-codes/trade-backend/src/modules/common/auth.middleware.ts`

## 3) API Token Calling Rules

- API token 只允许访问 `/trade` 路由。
- 可通过以下任一方式传 token：
  - Header: `x-api-token: tc_xxx`
  - Header: `Authorization: Bearer tc_xxx`
- API token 可读写 trade，但**不能删除**交易（`DELETE /trade/:transactionId` 会被拒绝）。

## 4) Endpoints For This Skill

### 4.1 Create Trade

- Method: `POST`
- Path: `/trade`
- Body: `CreateTradeDto`
- Success response:

```json
{
  "success": true,
  "message": "创建成功",
  "data": { "...full trade object...": "..." }
}
```

### 4.2 Update Trade

- Method: `PATCH`
- Path: `/trade/:transactionId`
- Body: `UpdateTradeDto`
- Success response:

```json
{
  "success": true,
  "message": "更新成功",
  "data": { "...full trade object...": "..." }
}
```

## 5) Request Contract (Create / Update)

### 5.1 Enum Values (must match exactly)

- `tradeType`: `模拟交易` | `真实交易`
- `status`: `已分析` | `待入场` | `已入场` | `已离场` | `提前离场` | `未入场`
- `marketStructure`: `震荡` | `趋势` | `暂无法判断` | `停止` | `转换`
- `entryDirection`: `多` | `空`
- `tradeResult`: `PROFIT` | `LOSS` | `BREAKEVEN`
- `exitType`: `TP` | `SL` | `MANUAL` | `TIME` | `FORCED`
- `exitQualityTag`: `TECHNICAL` | `EMOTIONAL` | `SYSTEM` | `UNKNOWN`
- `grade`: `高` | `中` | `低`

### 5.2 Base Required Fields

Create (`POST /trade`) 必传：
- `analysisTime` (ISO 8601)
- `tradeType`
- `status`
- `tradeSubject`
- `marketStructure`
- `marketStructureAnalysis`
- `entryPlanA` (object)

Update (`PATCH /trade/:transactionId`) 必传：
- `analysisTime` (ISO 8601)
- `tradeSubject`

注意：更新接口虽然是 PATCH，但后端 DTO 里 `analysisTime` 和 `tradeSubject` 不是可选，必须带上。

### 5.3 Status-driven Conditional Required

当 `status` 为 `已入场` / `已离场` / `提前离场` 时，创建请求应包含：
- `entryPrice`, `entryTime`, `entryDirection`, `stopLoss`, `takeProfit`
- `entryReason`, `exitReason`, `mentalityNotes`

当 `status` 为 `已离场` / `提前离场` 时，创建请求应包含：
- `exitPrice`, `exitTime`, `tradeResult`, `followedPlan`, `actualPathAnalysis`

当 `followedPlan=true` 且 `status` 为 `已离场` / `提前离场` 时：
- `followedPlanId` 必填

`status=提前离场` 时：
- `earlyExitReason` 建议填写（后端允许空，但业务语义上建议提供）

### 5.4 Exit Quality Hard Rule (Service-level)

当状态为 `已离场` 或 `提前离场` 时，`exitQualityTag` 实际上是强约束：
- 常规情况必须提供 `exitQualityTag`
- 例外：若 `tradeTags` 同时包含 `binance` 与 `auto-import`，服务端可自动写入 `SYSTEM`

## 6) Field Semantics Dictionary (No Ambiguity)

以下为 Trade 实体字段真实含义与写入建议。

| 字段 | 含义（业务语义） | 类型 | 建议 |
|---|---|---|---|
| transactionId | 交易唯一 ID（主键的一部分） | string | Create 可传（草稿/幂等），不传由服务端生成 |
| userId | 所属用户 ID（主键） | string | 服务端注入，客户端不要传 |
| tradeShortId | 外部短 ID（如 webhook 关联） | string | 服务端生成，客户端不要传 |
| analysisTime | 做这笔交易分析的时间点 | ISO string | 必须是 ISO 8601 |
| analysisPeriod | 分析周期（15分钟/30分钟/1小时/4小时/1天或自定义） | string | 可选 |
| status | 当前交易进展状态，不是盈亏结果 | enum | 必须使用枚举原值 |
| tradeType | 模拟盘或实盘 | enum | 必填 |
| tradeSubject | 交易标的（如 btc、eth） | string | 建议统一小写 |
| grade | 交易重要性分级 | enum | 可选 |
| analysisExpired | 分析是否过期（人工标记） | boolean | 可选 |
| isShareable | 是否允许分享 | boolean | 分享流程字段，创建/更新策略里通常不主动改 |
| shareId | 对外分享 ID | string | 服务端管理 |
| volumeProfileImages | 成交量分布图（旧结构） | ImageResource[] | 可选，最多 10 |
| marketStructureAnalysisImages | 市场结构分析图（新结构） | MarketStructureAnalysisImage[] | 可选，最多 10 |
| trendAnalysisImages | 走势分析图 | MarketStructureAnalysisImage[] | 可选，最多 5 |
| poc | 成交量控制点价格（Point of Control） | number | 可选 |
| val | 价值区下沿（Value Area Low） | number | 可选 |
| vah | 价值区上沿（Value Area High） | number | 可选 |
| keyPriceLevels | 关键价位文本说明 | string | 可选 |
| marketStructure | 对行情结构的判断 | enum | 必填 |
| marketStructureAnalysis | 对结构判断的文字解释 | string | 必填 |
| preEntrySummary | 入场前总结 | string | 可选 |
| expectedPathImages | 预期走势图（旧结构） | ImageResource[] | 可选，最多 5 |
| expectedPathImagesDetailed | 预期走势图（新结构） | MarketStructureAnalysisImage[] | 可选，最多 5 |
| expectedPathAnalysis | 预期路径分析文本 | string | 可选 |
| entryPlanA | 主交易计划（A） | EntryPlan | Create 必填 |
| entryPlanB | 备选计划 B | EntryPlan | 可选 |
| entryPlanC | 备选计划 C | EntryPlan | 可选 |
| preEntrySummaryImportance | 入场前总结重要性评分 | number(1-5) | 可选 |
| checklist | 入场前检查清单 | ChecklistState | 可选 |
| entryPrice | 实际入场价 | number | 已入场及以后建议必填 |
| entryTime | 实际入场时间 | ISO string | 已入场及以后建议必填 |
| entryDirection | 入场方向（多/空） | enum | 已入场及以后建议必填 |
| stopLoss | 止损位 | number | 已入场及以后建议必填 |
| takeProfit | 止盈位 | number | 已入场及以后建议必填 |
| entryReason | 入场理由 | string | 已入场及以后建议必填 |
| exitReason | 离场理由（常规） | string | 已入场及以后建议必填 |
| earlyExitReason | 提前离场补充原因 | string | 仅提前离场使用 |
| mentalityNotes | 交易过程中心态记录 | string | 已入场及以后建议必填 |
| entryAnalysisImages | 入场后分析图（旧结构） | ImageResource[] | 可选，最多 10 |
| entryAnalysisImagesDetailed | 入场后分析图（新结构） | MarketStructureAnalysisImage[] | 可选，最多 10 |
| exitPrice | 实际离场价 | number | 已离场/提前离场建议必填 |
| exitTime | 实际离场时间 | ISO string | 已离场/提前离场建议必填 |
| tradeResult | 结果（盈/亏/保本） | enum | 已离场/提前离场建议必填 |
| followedPlan | 是否按计划执行 | boolean | 已离场/提前离场建议必填 |
| followedPlanId | 跟随的计划 ID（如 planA） | string | followedPlan=true 时必填 |
| actualPathImages | 实际走势图（旧结构） | ImageResource[] | 可选，最多 10 |
| actualPathImagesDetailed | 实际走势图（新结构） | MarketStructureAnalysisImage[] | 可选，最多 5 |
| actualPathAnalysis | 实际路径复盘分析 | string | 已离场/提前离场建议必填 |
| tradeTags | 标签（回测/统计） | string[] | 可选 |
| remarks | 备注 | string | 可选 |
| lessonsLearned | 经验总结 | string | 可选 |
| lessonsLearnedImportance | 经验总结重要性评分 | number(1-5) | 可选 |
| analysisImages | 综合分析图（旧结构） | ImageResource[] | 可选，最多 10 |
| analysisImagesDetailed | 综合分析图（新结构） | MarketStructureAnalysisImage[] | 可选，最多 5 |
| riskModelVersion | 风险模型版本（如 r-v1） | string | 可选 |
| plannedRiskAmount | 计划风险金额 | number | 可选 |
| plannedRiskPct | 计划风险占比 | number | 可选 |
| plannedRiskPerUnit | 每单位计划风险（自动算） | number | 自动计算，不建议手写 |
| plannedRewardPerUnit | 每单位计划收益（自动算） | number | 自动计算，不建议手写 |
| plannedRR | 计划盈亏比 R（自动算） | number | 自动计算，不建议手写 |
| realizedR | 实现 R（自动算） | number | 自动计算，不建议手写 |
| rEfficiency | R 执行效率（自动算） | number | 自动计算，不建议手写 |
| exitDeviationR | 离场偏差 R（计划R-实现R） | number | 自动计算，不建议手写 |
| maxFavorableExcursionR | MFE（最大有利波动，按R） | number | 可选手填 |
| maxAdverseExcursionR | MAE（最大不利波动，按R） | number | 可选手填 |
| exitType | 离场方式分类 | enum | 可选 |
| exitQualityTag | 离场质量标签 | enum | 已离场/提前离场建议必填 |
| exitReasonCode | 离场原因代码（可扩展） | string | 可选 |
| exitReasonNote | 离场原因补充说明 | string | 可选 |
| rMetricsReady | R 指标是否完整可用 | boolean | 自动计算，不建议手写 |
| profitLossPercentage | 盈亏百分比（兼容字段） | number | 可选，必须是有限数字 |
| riskRewardRatio | 风险收益比（旧字符串字段） | string | 兼容字段，尽量少用 |
| followedSystemStrictly | 是否严格执行系统 | boolean | 可选 |
| createdAt | 创建时间 | ISO string | 服务端写 |
| updatedAt | 更新时间 | ISO string | 服务端写 |

## 7) Nested Object Schemas

### 7.1 ImageResource

```json
{
  "key": "images/.../file.jpg",
  "url": "https://..."
}
```

### 7.2 MarketStructureAnalysisImage

```json
{
  "image": { "key": "images/.../file.jpg", "url": "https://..." },
  "title": "15分钟结构图",
  "analysis": "这里解释图中结构和交易意义"
}
```

### 7.3 EntryPlan

```json
{
  "entryReason": "为什么入场",
  "entrySignal": "触发入场的信号",
  "exitSignal": "触发离场的信号"
}
```

### 7.4 ChecklistState

```json
{
  "phaseAnalysis": true,
  "rangeAnalysis": true,
  "trendAnalysis": false,
  "riskRewardCheck": true
}
```

## 8) Safe Agent Workflow

1. 若是更新，先 `GET /trade/:transactionId` 拉取现状，再合并生成 patch body。  
2. patch body 必带 `analysisTime` 与 `tradeSubject`（来自现有记录或新分析）。  
3. 当状态进入 `已离场/提前离场`，同时补齐：`exitPrice/exitTime/tradeResult/followedPlan/actualPathAnalysis/exitQualityTag`。  
4. 不主动写服务端托管或自动计算字段（如 `userId`、`createdAt`、`plannedRR` 等）。  
5. 时间统一使用 ISO 8601，数字字段保证 finite number。  

## 9) Minimal Request Examples

### 9.1 Create (analysis stage)

```json
{
  "analysisTime": "2026-02-11T10:30:00+08:00",
  "analysisPeriod": "1小时",
  "tradeType": "模拟交易",
  "status": "已分析",
  "tradeSubject": "eth",
  "marketStructure": "震荡",
  "marketStructureAnalysis": "当前在价值区内震荡，等待方向选择",
  "entryPlanA": {
    "entryReason": "等待关键位确认",
    "entrySignal": "放量突破上沿",
    "exitSignal": "跌回区间内"
  }
}
```

### 9.2 Update (move to exited)

```json
{
  "analysisTime": "2026-02-11T10:30:00+08:00",
  "tradeSubject": "eth",
  "status": "已离场",
  "entryPrice": 2480,
  "entryTime": "2026-02-11T11:00:00+08:00",
  "entryDirection": "多",
  "stopLoss": 2440,
  "takeProfit": 2550,
  "entryReason": "突破确认",
  "exitReason": "达到目标位",
  "mentalityNotes": "执行稳定",
  "exitPrice": 2542,
  "exitTime": "2026-02-11T14:20:00+08:00",
  "tradeResult": "PROFIT",
  "followedPlan": true,
  "followedPlanId": "planA",
  "actualPathAnalysis": "按预期上行后到达目标",
  "exitQualityTag": "TECHNICAL"
}
```

## 10) Machine Contract (for tooling)

```json
{
  "name": "trade-api-token-agent",
  "contractVersion": "3.0.0",
  "auth": {
    "tokenPrefix": "tc_",
    "headers": ["x-api-token", "Authorization: Bearer tc_..."]
  },
  "sourceModule": "/Users/linuo/codes/trade-codes/trade-backend/src/modules/trade/trade.module.ts",
  "endpoints": [
    {
      "id": "createTrade",
      "method": "POST",
      "path": "/trade",
      "requestDto": "CreateTradeDto",
      "response": { "success": true, "message": "创建成功", "data": "Trade" }
    },
    {
      "id": "updateTrade",
      "method": "PATCH",
      "path": "/trade/{transactionId}",
      "requestDto": "UpdateTradeDto",
      "response": { "success": true, "message": "更新成功", "data": "Trade" }
    }
  ],
  "updateHardRequired": ["analysisTime", "tradeSubject"],
  "exitedStatus": ["已离场", "提前离场"],
  "autoComputedFields": [
    "plannedRiskPerUnit",
    "plannedRewardPerUnit",
    "plannedRR",
    "realizedR",
    "rEfficiency",
    "exitDeviationR",
    "rMetricsReady"
  ]
}
```
