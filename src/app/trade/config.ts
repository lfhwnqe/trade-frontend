/**
 * 交易表单枚举/选项配置（与后端 CreateTradeDto 保持同步）
 */

export const entryDirectionOptions = [
  { label: '多单', value: 'Long' },
  { label: '空单', value: 'Short' },
];

export const signalTypeOptions = [
  { label: '信号A', value: 'A' },
  { label: '信号B', value: 'B' },
  { label: '信号C', value: 'C' },
  // 如有更多类型可补充
];

export const marketStructureOptions = [
  { label: '结构1', value: '结构1' },
  { label: '结构2', value: '结构2' },
  // 如有更多类型可补充
];

/**
 * 用于跨页面/表单复用
 */
export const tradeFieldConfigs = {
  entryDirection: entryDirectionOptions,
  signalType: signalTypeOptions,
  marketStructure: marketStructureOptions,
};