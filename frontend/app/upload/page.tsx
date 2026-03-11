"use client";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Alert, Box, Button, Container, Paper, Stack, Typography } from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import ReceiptProcessingOverlay from "@/components/ReceiptProcessingOverlay";
import PendingItemsForm from "@/components/PendingItemsForm";
import { useReceiptUpload } from "@/hooks/useReceiptUpload";
import { API_BASE } from "@/lib/api";
import {
  PENDING_STORAGE_KEY,
  deserializePending,
  serializePending,
  buildBatchPayload,
  isMobileUpload,
} from "@/lib/receipt";

function UploadContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session");

  const [sessionUploading, setSessionUploading] = useState(false);
  const [sessionSent, setSessionSent] = useState(false);
  const [sessionError, setSessionError] = useState("");

  const {
    pendingItems,
    setPendingItems,
    ocrProcessing,
    error,
    setError,
    handleFileSelect,
    handleUpdatePendingItem,
    handleRemovePendingItem,
  } = useReceiptUpload(false);

  useEffect(() => {
    const stored = sessionStorage.getItem(PENDING_STORAGE_KEY);
    if (stored) {
      const items = deserializePending(stored);
      if (items.length > 0) {
        setPendingItems(items);
        sessionStorage.removeItem(PENDING_STORAGE_KEY);
      }
    }
  }, [setPendingItems]);

  const handleSessionFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/") || !sessionId) return;
    setSessionUploading(true);
    setSessionError("");
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch(`${API_BASE}/receipt/ocr?session_id=${encodeURIComponent(sessionId)}`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Upload failed");
      setSessionSent(true);
    } catch (err) {
      setSessionError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setSessionUploading(false);
      e.target.value = "";
    }
  };

  const handleSaveToFridge = async () => {
    const invalid = pendingItems.some((p) => !p.itemName.trim() || !p.expiryDate);
    if (invalid) {
      setError("Fill in item name and expiry for all items");
      return;
    }
    const token = localStorage.getItem("user_token");
    if (!token) {
      sessionStorage.setItem(PENDING_STORAGE_KEY, serializePending(pendingItems));
      router.push("/login?return=/upload");
      return;
    }
    setError("");
    const payload = buildBatchPayload(pendingItems);
    const res = await fetch(`${API_BASE}/items/batch`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error("Save failed");
    setPendingItems([]);
    router.push("/userhome");
  };

  const showUpload = pendingItems.length === 0;

  if (sessionId) {
    return (
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <Container maxWidth="sm" sx={{ py: 4 }}>
          <Stack spacing={3}>
            <Typography variant="h5" fontWeight={600}>
              Send receipt to browser
            </Typography>
            {sessionError && (
              <Alert severity="error" onClose={() => setSessionError("")}>
                {sessionError}
              </Alert>
            )}
            {sessionSent ? (
              <Paper elevation={2} sx={{ p: 3, textAlign: "center" }}>
                <Typography color="text.secondary" sx={{ mb: 2 }}>
                  Receipt sent to your browser. You can close this page.
                </Typography>
              </Paper>
            ) : (
              <Paper elevation={2} sx={{ p: 3 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Take a photo of your receipt — it will appear on the browser that showed the QR code.
                </Typography>
                <Button variant="contained" component="label" fullWidth size="large">
                  {isMobileUpload() ? "Take photo" : "Choose image"}
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    hidden
                    onChange={handleSessionFileSelect}
                    disabled={sessionUploading}
                  />
                </Button>
              </Paper>
            )}
          </Stack>
        </Container>
        {sessionUploading && <ReceiptProcessingOverlay />}
      </LocalizationProvider>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Container maxWidth="sm" sx={{ py: 4 }}>
        <Stack spacing={3}>
          <Typography variant="h5" fontWeight={600}>
            Upload Receipt
          </Typography>
          {error && (
            <Alert severity="error" onClose={() => setError("")}>
              {error}
            </Alert>
          )}
          {showUpload ? (
            <Paper elevation={2} sx={{ p: 3 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Take a photo of your grocery receipt
              </Typography>
              <Button variant="contained" component="label" fullWidth size="large">
                {isMobileUpload() ? "Take photo" : "Choose image"}
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  hidden
                  onChange={handleFileSelect}
                  disabled={ocrProcessing}
                />
              </Button>
              <Button variant="text" sx={{ mt: 2 }} onClick={() => router.push("/login")}>
                Already have an account? Log in
              </Button>
            </Paper>
          ) : (
            <PendingItemsForm
              pendingItems={pendingItems}
              onUpdate={handleUpdatePendingItem}
              onRemove={handleRemovePendingItem}
              onSave={handleSaveToFridge}
              datePickerMinWidth={140}
              useIconButton={false}
              extraAction={
                <Button variant="text" sx={{ mt: 1 }} onClick={() => setPendingItems([])}>
                  Upload different receipt
                </Button>
              }
            />
          )}
        </Stack>
      </Container>
      {ocrProcessing && <ReceiptProcessingOverlay />}
    </LocalizationProvider>
  );
}

export default function UploadPage() {
  return (
    <Suspense fallback={<Box sx={{ p: 4, textAlign: "center" }}>Loading…</Box>}>
      <UploadContent />
    </Suspense>
  );
}
