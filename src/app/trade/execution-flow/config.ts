export type ExecutionFlowStatus =
  | "ANALYSIS"
  | "PLAN"
  | "CHECKLIST"
  | "REVIEW";

export type ExecutionFlowListItem = {
  runId: string;
  title: string;
  tradeSubject: string;
  currentStep: ExecutionFlowStatus;
  status: ExecutionFlowStatus;
  createdAt: string;
  updatedAt: string;
};

export type ExecutionFlowListResponse = {
  items: ExecutionFlowListItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export type ExecutionFlowQuery = {
  page?: number;
  pageSize?: number;
  limit?: number;
  tradeSubject?: string;
  status?: ExecutionFlowStatus;
  dateFrom?: string;
  dateTo?: string;
};

export type CreateExecutionFlowRunDto = {
  title: string;
  tradeSubject: string;
  status?: ExecutionFlowStatus;
};

export type UpdateExecutionFlowRunDto = {
  title?: string;
  tradeSubject?: string;
  status?: ExecutionFlowStatus;
};
