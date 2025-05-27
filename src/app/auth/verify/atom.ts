import { createImmerAtom } from "@/hooks/useAtomImmer";

export const formAtom = createImmerAtom({
  username: "",
  code: "",
  error: "",
  message: "",
  isLoading: false,
});
