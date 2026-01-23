import { createImmerAtom } from "@/hooks/useAtomImmer";

export type UserProfile = {
  username: string;
  email: string;
  role: string;
};

export const userAtom = createImmerAtom<UserProfile>({
  username: "",
  email: "",
  role: "",
});
