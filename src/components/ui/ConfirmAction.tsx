"use client";

import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/MotionModal";

interface ConfirmActionProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  children: ReactNode;
  confirmLabel?: string;
  destructive?: boolean;
  loading?: boolean;
}

export function ConfirmAction({ open, onClose, onConfirm, title, children, confirmLabel = "Confirmer", destructive, loading }: ConfirmActionProps) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      <div className="text-[15px] leading-relaxed text-muted-foreground">{children}</div>
      <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button variant="ghost" onClick={onClose} disabled={loading}>
          Annuler
        </Button>
        <Button variant={destructive ? "destructive" : "default"} onClick={onConfirm} loading={loading}>
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}
