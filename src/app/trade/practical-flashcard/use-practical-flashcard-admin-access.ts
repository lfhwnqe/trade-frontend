"use client";

import * as React from "react";
import { useAtomImmer } from "@/hooks/useAtomImmer";
import { userAtom } from "@/store/user";

const USER_STORAGE_KEY = "userProfile";
const ADMIN_ROLES = new Set(["Admins", "SuperAdmins"]);

export function usePracticalFlashcardAdminAccess() {
  const [user, setUser] = useAtomImmer(userAtom);
  const [cachedRole, setCachedRole] = React.useState("");
  const [loaded, setLoaded] = React.useState(false);

  React.useEffect(() => {
    if (typeof window === "undefined") {
      setLoaded(true);
      return;
    }

    const cachedUser = window.localStorage.getItem(USER_STORAGE_KEY);
    if (cachedUser) {
      try {
        const parsed = JSON.parse(cachedUser) as {
          username?: string;
          email?: string;
          role?: string;
        };
        setCachedRole(parsed.role || "");
        if (!user.username && !user.email && (parsed.username || parsed.email)) {
          setUser((draft) => {
            draft.username = parsed.username || "";
            draft.email = parsed.email || "";
            draft.role = parsed.role || "";
          });
        }
      } catch {
        window.localStorage.removeItem(USER_STORAGE_KEY);
      }
    }

    setLoaded(true);
  }, [setUser, user.email, user.username]);

  const role = user.role || cachedRole || "FreePlan";
  return {
    loaded,
    role,
    isAdmin: ADMIN_ROLES.has(role),
  };
}

