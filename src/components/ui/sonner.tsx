"use client";

import { useTheme } from "next-themes";
import { Toaster as Sonner, type ToasterProps } from "sonner";

export function Toaster(props: ToasterProps) {
  const { resolvedTheme } = useTheme();
  return (
    <Sonner
      theme={resolvedTheme === "dark" ? "dark" : "light"}
      position="top-center"
      richColors
      toastOptions={{ style: { fontFamily: "var(--font-jost), system-ui, sans-serif", borderRadius: "14px" } }}
      {...props}
    />
  );
}
