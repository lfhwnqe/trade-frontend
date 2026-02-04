// 交易新增/编辑页面的 atom 声明，推荐所有页面通用/jotai 状态都分离到本文件

import { createImmerAtom } from "@/hooks/useAtomImmer";
import type { Trade } from "../config";

// 支持动态 key 赋值的表单类型
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type FormState = Partial<Trade> & { [key: string]: any };

export const formInitialState: FormState = {
  analysisTime: new Date().toISOString(), // 默认设置当前时间
  status: undefined,
  marketStructure: undefined,
  volumeProfileImages: [],
  marketStructureAnalysisImages: [],
  trendAnalysisImages: [],
  expectedPathImages: [],
  expectedPathImagesDetailed: [],
  entryAnalysisImages: [],
  entryAnalysisImagesDetailed: [],
  actualPathImages: [],
  actualPathImagesDetailed: [],
  analysisImages: [],
  analysisImagesDetailed: [],
  entryPlanA: { entryReason: "", entrySignal: "", exitSignal: "" },
  entryPlanB: { entryReason: "", entrySignal: "", exitSignal: "" },
  entryPlanC: { entryReason: "", entrySignal: "", exitSignal: "" },
  checklist: {
    phaseAnalysis: false,
    rangeAnalysis: false,
    trendAnalysis: false,
    riskRewardCheck: false,
  },
};

export const formAtom = createImmerAtom<FormState>(formInitialState);

export const loadingAtom = createImmerAtom(false);
export const detailLoadingAtom = createImmerAtom(false);
