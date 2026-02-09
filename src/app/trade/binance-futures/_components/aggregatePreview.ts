export type AggregatePreviewResp = {
  success: boolean;
  data?: {
    scannedFills: number;
    totals: { buyQty: number; sellQty: number; netQty: number };
    preview: unknown;
    closedPositions: unknown[];
    openPositions: unknown[];
    warnings?: string[];
  };
};

