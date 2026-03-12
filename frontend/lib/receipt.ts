import type { Dayjs } from "dayjs";
import dayjs from "dayjs";

export type PendingItem = {
  itemName: string;
  expiryDate: Dayjs | null;
};

export const PENDING_STORAGE_KEY = "keepfresh_pending_items";

export function serializePending(items: PendingItem[]): string {
  return JSON.stringify(
    items.map((p) => ({
      itemName: p.itemName,
      expiryDate: p.expiryDate?.format("YYYY-MM-DD") ?? null,
    }))
  );
}

export function deserializePending(s: string): PendingItem[] {
  try {
    const arr = JSON.parse(s);
    return arr.map((p: { itemName: string; expiryDate: string | null }) => ({
      itemName: p.itemName,
      expiryDate: p.expiryDate ? dayjs(p.expiryDate) : null,
    }));
  } catch {
    return [];
  }
}

export function buildBatchPayload(pendingItems: PendingItem[]) {
  const today = dayjs().format("YYYY-MM-DD");
  return pendingItems.map((p) => ({
    itemName: p.itemName.trim(),
    purchaseDate: today,
    expiryDate: p.expiryDate!.format("YYYY-MM-DD"),
    quantity: 1,
    notes: "",
  }));
}

export function isMobileUpload(): boolean {
  return typeof window !== "undefined" && /iPad|iPhone|Android/i.test(navigator.userAgent);
}
