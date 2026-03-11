"use client";
import { useState, useCallback } from "react";
import type { Dayjs } from "dayjs";
import { API_BASE } from "@/lib/api";
import type { PendingItem } from "@/lib/receipt";

const OCR_EXTRACT_MAP = (x: { itemName: string }) => ({
  itemName: x.itemName,
  expiryDate: null as Dayjs | null,
});

export function useReceiptUpload(requireAuth = false) {
  const [ocrProcessing, setOcrProcessing] = useState(false);
  const [pendingItems, setPendingItems] = useState<PendingItem[]>([]);
  const [error, setError] = useState("");

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !file.type.startsWith("image/")) return;
      if (requireAuth && !localStorage.getItem("user_token")) {
        setError("Please log in to upload");
        return;
      }

      setOcrProcessing(true);
      setError("");
      const formData = new FormData();
      formData.append("file", file);

      try {
        const res = await fetch(`${API_BASE}/receipt/ocr`, {
          method: "POST",
          body: formData,
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || "OCR failed");
        const extracted = (data.items ?? []).map(OCR_EXTRACT_MAP);
        setPendingItems(extracted);
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to process receipt");
        return false;
      } finally {
        setOcrProcessing(false);
        e.target.value = "";
      }
    },
    [requireAuth]
  );

  const handleUpdatePendingItem = useCallback(
    (idx: number, field: "itemName" | "expiryDate", value: string | Dayjs | null) => {
      setPendingItems((prev) =>
        prev.map((p, i) => (i === idx ? { ...p, [field]: value } : p))
      );
    },
    []
  );

  const handleRemovePendingItem = useCallback((idx: number) => {
    setPendingItems((prev) => prev.filter((_, i) => i !== idx));
  }, []);

  return {
    pendingItems,
    setPendingItems,
    ocrProcessing,
    error,
    setError,
    handleFileSelect,
    handleUpdatePendingItem,
    handleRemovePendingItem,
  };
}
