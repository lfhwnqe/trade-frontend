import { createImmerAtom } from "@/hooks/useAtomImmer";

export const loginFormAtom = createImmerAtom({
  email: "",
  password: "",
  error: "",
  isLoading: false,
});