export const PLAYBOOK_TEMPLATE_STATUSES = ["ACTIVE", "DISABLED"] as const;
export type PlaybookTemplateStatus = (typeof PLAYBOOK_TEMPLATE_STATUSES)[number];

export type PlaybookTemplateStatusFilter = PlaybookTemplateStatus | "ALL";

export const PLAYBOOK_TEMPLATE_SORT_BYS = ["CREATED_AT", "UPDATED_AT", "SORT_ORDER"] as const;
export type PlaybookTemplateSortBy = (typeof PLAYBOOK_TEMPLATE_SORT_BYS)[number];

export const PLAYBOOK_TEMPLATE_SORT_ORDERS = ["asc", "desc"] as const;
export type PlaybookTemplateSortOrder = (typeof PLAYBOOK_TEMPLATE_SORT_ORDERS)[number];

export type PlaybookTemplateImageScope = "analysis" | "in-progress" | "completed-trend";

export type PlaybookTemplatePlaybookItem = {
  code: string;
  label: string;
  color?: string;
  status?: string;
};

export type PlaybookTemplate = {
  id: string;
  userId: string;
  cardId: string;
  templateId: string;
  entityType: "PLAYBOOK_TEMPLATE";
  playbookType: string;
  playbookItem?: PlaybookTemplatePlaybookItem;
  title: string;
  analysisImageUrl: string;
  analysisImageKey?: string;
  inProgressImageUrl: string;
  inProgressImageKey?: string;
  completedTrendImageUrl: string;
  completedTrendImageKey?: string;
  notes?: string;
  sortOrder?: number;
  status: PlaybookTemplateStatus;
  createdAt: string;
  updatedAt: string;
};

export type PlaybookTemplateCountItem = {
  playbookType: string;
  playbookItem?: PlaybookTemplatePlaybookItem;
  totalCount: number;
  activeCount: number;
  disabledCount: number;
  limit: number;
};

export const PLAYBOOK_TEMPLATE_LABELS: Record<string, string> = {
  ACTIVE: "启用",
  DISABLED: "停用",
  ALL: "全部",
  CREATED_AT: "创建时间",
  UPDATED_AT: "最后编辑时间",
  SORT_ORDER: "排序值",
};
