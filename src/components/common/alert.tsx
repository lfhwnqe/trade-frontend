"use client";
import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useCallback,
} from "react";
import { Alert, AlertTitle, AlertDescription } from "../ui/alert";
import { CheckCircle2, XCircle } from "lucide-react";
import clsx from "clsx";

type AlertType = "success" | "error" | "none";

interface AlertState {
  type: AlertType;
  title: string;
  description?: string;
  open: boolean;
}

interface AlertContextProps {
  success: (title: string, description?: string) => void;
  error: (title: string, description?: string) => void;
}

const AlertContext = createContext<AlertContextProps | undefined>(undefined);

export const useAlert = () => {
  const ctx = useContext(AlertContext);
  if (!ctx) throw new Error("useAlert must be used within AlertProvider");
  return [ctx.success, ctx.error];
};

const AUTO_CLOSE_MS = 2500;

export function AlertProvider({ children }: { children: ReactNode }) {
  const [alertState, setAlertState] = useState<AlertState>({
    type: "none",
    title: "",
    description: "",
    open: false,
  });

  // 关闭弹窗
  const close = useCallback(
    () => setAlertState((s) => ({ ...s, open: false })),
    []
  );

  // 显示成功弹窗
  const success = (title: string, description?: string) => {
    setAlertState({
      type: "success",
      title,
      description,
      open: true,
    });
    setTimeout(close, AUTO_CLOSE_MS);
  };

  // 显示错误弹窗
  const error = (title: string, description?: string) => {
    setAlertState({
      type: "error",
      title,
      description,
      open: true,
    });
    setTimeout(close, AUTO_CLOSE_MS);
  };

  // 动画
  const animClass = clsx(
    "fixed top-6 left-1/2 z-50 -translate-x-1/2 transition-all duration-300",
    alertState.open
      ? "opacity-100 pointer-events-auto scale-100"
      : "opacity-0 pointer-events-none scale-95"
  );

  return (
    <AlertContext.Provider value={{ success, error }}>
      {children}
      {/* 弹窗内容 使用 shadcn Alert */}
      {alertState.open && alertState.type !== "none" && (
        <div className={animClass}>
          <Alert
            variant={alertState.type === "error" ? "destructive" : "default"}
            className="shadow-xl min-w-[320px] max-w-[94vw]"
          >
            {alertState.type === "success" && (
              <CheckCircle2 className="text-green-500" />
            )}
            {alertState.type === "error" && (
              <XCircle className="text-red-500" />
            )}
            <AlertTitle>{alertState.title}</AlertTitle>
            {alertState.description && (
              <AlertDescription>{alertState.description}</AlertDescription>
            )}
          </Alert>
        </div>
      )}
    </AlertContext.Provider>
  );
}
