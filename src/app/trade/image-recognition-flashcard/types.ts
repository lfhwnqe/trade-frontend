export const IMAGE_RECOGNITION_FLASHCARD_STATUSES = ["ACTIVE", "DISABLED"] as const;
export type ImageRecognitionFlashcardStatus = (typeof IMAGE_RECOGNITION_FLASHCARD_STATUSES)[number];

export type ImageRecognitionFlashcardStatusFilter = ImageRecognitionFlashcardStatus | "ALL";

export const IMAGE_RECOGNITION_FLASHCARD_SAMPLE_RESULTS = ["SUCCESS", "FAIL"] as const;
export type ImageRecognitionFlashcardSampleResult = (typeof IMAGE_RECOGNITION_FLASHCARD_SAMPLE_RESULTS)[number];

export const IMAGE_RECOGNITION_FLASHCARD_CARD_SORT_BYS = ["CREATED_AT", "UPDATED_AT"] as const;
export type ImageRecognitionFlashcardCardSortBy = (typeof IMAGE_RECOGNITION_FLASHCARD_CARD_SORT_BYS)[number];

export const IMAGE_RECOGNITION_FLASHCARD_CARD_SORT_ORDERS = ["asc", "desc"] as const;
export type ImageRecognitionFlashcardCardSortOrder = (typeof IMAGE_RECOGNITION_FLASHCARD_CARD_SORT_ORDERS)[number];

export type ImageRecognitionFlashcardPlaybookItem = {
  code: string;
  label: string;
  color?: string;
  status?: string;
};

export type ImageRecognitionFlashcardCard = {
  id: string;
  userId: string;
  cardId: string;
  entityType: "IMAGE_RECOGNITION_FLASHCARD";
  imageUrl: string;
  imageKey?: string;
  playbookType: string;
  playbookItem?: ImageRecognitionFlashcardPlaybookItem;
  sampleResult?: ImageRecognitionFlashcardSampleResult;
  notes?: string;
  status: ImageRecognitionFlashcardStatus;
  ownerRole?: string;
  createdAt: string;
  updatedAt: string;
};

export type ImageRecognitionFlashcardPlaybookStat = {
  playbookType: string;
  playbookItem?: ImageRecognitionFlashcardPlaybookItem;
  totalCount: number;
  successCount: number;
  failCount: number;
  unknownCount: number;
  successRate: number | null;
};

export const IMAGE_RECOGNITION_FLASHCARD_LABELS: Record<string, string> = {
  ACTIVE: "启用",
  DISABLED: "停用",
  ALL: "全部",
  SUCCESS: "成功",
  FAIL: "失败",
  CREATED_AT: "创建时间",
  UPDATED_AT: "最后编辑时间",
};
