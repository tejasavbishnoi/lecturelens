import { createContext, useContext } from "react";

// toast("Saved") or toast("Something failed", "error")
export const ToastContext = createContext(() => {});

export function useToast() {
  return useContext(ToastContext);
}
