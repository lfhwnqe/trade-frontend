import { createImmerAtom } from "@/hooks/useAtomImmer";

export type UserProfile = {
  username: string;
  email: string;
};

export const userAtom = createImmerAtom<UserProfile>({
  username: "",
  email: "",
});
