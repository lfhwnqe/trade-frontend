import { createImmerAtom } from "@/hooks/useAtomImmer";

export const formAtom = createImmerAtom({
  username: "",
  email: "",
  password: "",
  confirmPassword: "",
  error: "",
  message: "",
  isLoading: false,
});
