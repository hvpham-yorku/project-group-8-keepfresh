"use client";
import { Suspense, useEffect, useState, useMemo, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Alert,
  Box,
  Button,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import dayjs, { Dayjs } from "dayjs";
import { QRCodeSVG } from "qrcode.react";
import ReceiptProcessingOverlay from "@/components/ReceiptProcessingOverlay";
import PendingItemsForm from "@/components/PendingItemsForm";
import { useReceiptUpload } from "@/hooks/useReceiptUpload";
import { API_BASE, getQrAppBase } from "@/lib/api";
import { buildBatchPayload, isMobileUpload } from "@/lib/receipt";

function makeUploadSessionId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

type Item = {
  id: string;
  itemName: string;
  expiryDate: string;
};

type ExpiryColor = "red" | "yellow" | "green";

function getDaysUntilExpiry(expiryDate: string) {
  const today = dayjs().startOf("day");
  const expiry = dayjs(expiryDate).startOf("day");
  return expiry.diff(today, "day");
}

function getExpiryCountdownText(expiryDate: string) {
  const daysLeft = getDaysUntilExpiry(expiryDate);

  if (daysLeft < 0) {
    const daysAgo = Math.abs(daysLeft);
    return `Expired ${daysAgo} day${daysAgo === 1 ? "" : "s"} ago`;
  }

  if (daysLeft === 0) {
    return "Expires today";
  }

  if (daysLeft === 1) {
    return "Expires tomorrow";
  }

  return `Expires in ${daysLeft} days`;
}

function getExpiryColor(expiryDate: string): ExpiryColor {
  const daysLeft = getDaysUntilExpiry(expiryDate);

  if (daysLeft <= 0) {
    return "red";
  }

  if (daysLeft <= 3) {
    return "yellow";
  }

  return "green";
}

function getExpiryLabelStyles(color: ExpiryColor) {
  if (color === "red") {
    return {
      bg: "#fde2e2",
      text: "#b91c1c",
    };
  }

  if (color === "yellow") {
    return {
      bg: "#fef3c7",
      text: "#92400e",
    };
  }

  return {
    bg: "#dcfce7",
    text: "#166534",
  };
}

function UserHomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [username, setUsername] = useState<string>(""); //username field
  const [email, setEmail] = useState<string>(""); // new fields for email
  const [notificationDays, setNotificationDays] = useState<number>(7); //default noti days
  const [customNotificationDays, setCustomNotificationDays] = useState<number | null>(null); //user custom noti days
  const [items, setItems] = useState<Item[]>([]);
  const [itemsLoading, setItemsLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newItemName, setNewItemName] = useState("");
  const [newItemExpiry, setNewItemExpiry] = useState<Dayjs | null>(null);
  const [editItem, setEditItem] = useState<Item | null>(null);
  const [editName, setEditName] = useState("");
  const [editExpiry, setEditExpiry] = useState<Dayjs | null>(null);

  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [showPendingList, setShowPendingList] = useState(false);
  const [uploadSessionId, setUploadSessionId] = useState<string | null>(null);
  const [waitingForPhoneResult, setWaitingForPhoneResult] = useState(false);

  const {
    pendingItems,
    setPendingItems,
    ocrProcessing,
    error: receiptError,
    setError: setReceiptError,
    handleFileSelect: receiptHandleFileSelect,
    handleUpdatePendingItem,
    handleRemovePendingItem,
  } = useReceiptUpload(true);

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const ok = await receiptHandleFileSelect(e);
      if (ok) {
        setShowPendingList(true);
        setUploadModalOpen(false);
      }
    },
    [receiptHandleFileSelect]
  );

  const qrAppBase = getQrAppBase();
  const uploadUrl = useMemo(
    () => (uploadSessionId && qrAppBase ? `${qrAppBase}/upload?session=${uploadSessionId}` : ""),
    [uploadSessionId, qrAppBase]
  );

  useEffect(() => {
    if (uploadModalOpen && !uploadSessionId) {
      setUploadSessionId(makeUploadSessionId());
    }
    if (!uploadModalOpen) {
      setUploadSessionId(null);
      setWaitingForPhoneResult(false);
    }
  }, [uploadModalOpen, uploadSessionId]);

  useEffect(() => {
    if (!uploadSessionId || !uploadModalOpen) return;
    const poll = async () => {
      try {
        const res = await fetch(`${API_BASE}/receipt/result/${uploadSessionId}`);
        if (res.status === 202) {
          setWaitingForPhoneResult(true);
          return false;
        }
        if (res.status === 200) {
          const data = await res.json();
          const extracted = (data.items ?? []).map((x: { itemName: string }) => ({
            itemName: x.itemName,
            expiryDate: null as Dayjs | null,
          }));
          setPendingItems(extracted);
          setShowPendingList(true);
          setUploadModalOpen(false);
          setUploadSessionId(null);
          setWaitingForPhoneResult(false);
          return true;
        }
      } catch {
        // 404 or network - keep polling, no overlay
      }
      return false;
    };
    const interval = setInterval(async () => {
      const done = await poll();
      if (done) clearInterval(interval);
    }, 3000);
    poll();
    return () => clearInterval(interval);
  }, [uploadSessionId, uploadModalOpen]);

  useEffect(() => {
    if (searchParams.get("upload") === "1") setUploadModalOpen(true);
  }, [searchParams]);

  useEffect(() => {
    const user_token = localStorage.getItem("user_token");
    if (!user_token) {
      router.push("/login");
    }
  }, [router]);

  useEffect(() => {
    const storedUsername = localStorage.getItem("username");
    if (storedUsername) setUsername(storedUsername);
  }, []);

  useEffect(() => { //gets user token, calls backend, load email and noti settings into state
    const token = localStorage.getItem("user_token"); //get user token
    if (!token) return;
    fetch(`${API_BASE}/user`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : Promise.reject(res)))
      .then((data) => {
        const u = data.user;
        setEmail(u.email || "");
        setNotificationDays(u.notification_days_before_expiry ?? 7);
        setCustomNotificationDays(u.custom_notification_days_before_expiry ?? null);
      })
      .catch(() => {
        //nothing
      });
  }, []);


  useEffect(() => {
    const token = localStorage.getItem("user_token");
    if (!token) return;
    setItemsLoading(true);
    fetch(`${API_BASE}/items`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : Promise.reject(res)))
      .then((data) => setItems(data.items ?? []))
      .catch(() => setItems([]))
      .finally(() => setItemsLoading(false));
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("user_token");
    if (!token) return;
    fetch(`${API_BASE}/recommendations`, { headers: { Authorization: `Bearer ${token}` } });
  }, []);

  const handleOpenDialog = () => {
    setNewItemName("");
    setNewItemExpiry(null);
    setError("");
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
  };

  const handleAdd = () => {
    if (!newItemName.trim()) {
      setError("Food name is required");
      return;
    }
    if (!newItemExpiry) {
      setError("Expiry date is required");
      return;
    }

    const token = localStorage.getItem("user_token");
    if (!token) {
      setError("You must be logged in to add items");
      return;
    }

    const payload = {
      itemName: newItemName.trim(),
      purchaseDate: dayjs().format("YYYY-MM-DD"),
      expiryDate: newItemExpiry.format("YYYY-MM-DD"),
      quantity: 1,
      notes: "",
    };

    fetch(`${API_BASE}/items`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Add failed");
        return res.json();
      })
      .then((data) => {
        const newItem: Item = {
          id: data.item_id ?? Date.now().toString(),
          itemName: payload.itemName,
          expiryDate: payload.expiryDate,
        };
        setItems((prev) => [...prev, newItem]);
        setError("");
        setIsDialogOpen(false);
      })
      .catch(() => setError("Failed to add item"));
  };

  const handleDelete = (id: string) => {
    // Confirm before DELETE /items/:id with Bearer token.
    const itemToDelete = items.find((item) => item.id === id);
    const confirmed = window.confirm(
      `Are you sure you want to delete ${itemToDelete?.itemName ?? "this item"}?`
    );
    if (!confirmed) return;

    const token = localStorage.getItem("user_token");
    if (!token) return;
    fetch(`${API_BASE}/items/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Delete failed");
        setItems((prev) => prev.filter((item) => item.id !== id));
      })
      .catch(() => setError("Failed to delete item"));
  };

  const handleOpenEdit = (item: Item) => {
    setEditItem(item);
    setEditName(item.itemName);
    setEditExpiry(dayjs(item.expiryDate));
    setError("");
  };

  const handleCloseEdit = () => {
    setEditItem(null);
  };

  const handleSaveEdit = () => {
    // PUT /items/:id requires Bearer; server checks item belongs to this user.
    if (!editItem) return;
    if (!editName.trim()) {
      setError("Food name is required");
      return;
    }
    if (!editExpiry) {
      setError("Expiry date is required");
      return;
    }
    setError("");
    const token = localStorage.getItem("user_token");
    if (!token) return;
    fetch(`${API_BASE}/items/${editItem.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        name: editName.trim(),
        expiry_date: editExpiry.format("YYYY-MM-DD"),
      }),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Update failed");
        return res.json();
      })
      .then(() => {
        setItems((prev) =>
          prev.map((i) =>
            i.id === editItem.id
              ? { ...i, itemName: editName.trim(), expiryDate: editExpiry!.format("YYYY-MM-DD") }
              : i
          )
        );
        handleCloseEdit();
      })
      .catch(() => setError("Failed to update item"));
  };

  const handleOpenUpload = () => {
    setError("");
    setReceiptError("");
    setUploadModalOpen(true);
  };

  const handleCloseUpload = () => {
    if (!ocrProcessing && !waitingForPhoneResult) setUploadModalOpen(false);
  };

  const handleSaveToFridge = async () => {
    const invalid = pendingItems.some((p) => !p.itemName.trim() || !p.expiryDate);
    if (invalid) {
      setError("Fill in item name and expiry for all items");
      return;
    }
    const token = localStorage.getItem("user_token");
    if (!token) return;
    setError("");
    setReceiptError("");
    const payload = buildBatchPayload(pendingItems);
    const res = await fetch(`${API_BASE}/items/batch`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error("Save failed");
    setPendingItems([]);
    setShowPendingList(false);
    const data = await fetch(`${API_BASE}/items`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then((r) => r.json());
    setItems(data.items ?? []);
  };
  const sortedItems = [...items].sort((a, b) => {
    return dayjs(a.expiryDate).valueOf() - dayjs(b.expiryDate).valueOf();
  });

  const [search, setSearch] = useState("");

  const filteredItems = sortedItems.filter((item) =>
    item.itemName.toLowerCase().includes(search.trim().toLowerCase())
  );

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
    <Container maxWidth="lg" sx={{ py: 6 }}>
      <Stack spacing={3}>
        <Box>
          <Typography variant="h4" fontWeight={700}>
            Welcome back, {username || "friend"}!
          </Typography>
          <Typography color="text.secondary">
            Here’s your current fridge.
          </Typography>
        </Box>

        <Box mb={2}>
          <Typography variant="subtitle1" fontWeight={600}>
            Notification settings
          </Typography>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems="center" sx={{ mt: 1 }}>
            <TextField
              label="Default days before expiry"
              type="number"
              value={notificationDays}
              onChange={(e) => setNotificationDays(Number(e.target.value))}
              size="small"
              sx={{ width: 200 }}
              InputProps={{ inputProps: { min: 0 } }}
            />
            <TextField
              label="Extra days before expiry (optional)"
              type="number"
              value={customNotificationDays ?? ""}
              onChange={(e) => setCustomNotificationDays(e.target.value === "" ? null : Number(e.target.value))}
              size="small"
              sx={{ width: 220 }}
              InputProps={{ inputProps: { min: 0 } }}
            />
            <Button
              variant="outlined"
              onClick={async () => {
                const token = localStorage.getItem("user_token");
                if (!token) return;
                await fetch(`${API_BASE}/user`, {
                  method: "PUT",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                  },
                  body: JSON.stringify({
                    notification_days_before_expiry: notificationDays,
                    custom_notification_days_before_expiry: customNotificationDays,
                  }),
                });
              }}
            >
              Save
            </Button>
            <Button
              variant="contained"
              onClick={async () => {
                await fetch(`${API_BASE}/notifications/run`, { method: "POST" });
              }}
            >
              Send due notifications now
            </Button>
          </Stack>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Email: {email || "not set"}
          </Typography>
        </Box>
        <Box sx={{ borderBottom: "1px solid", borderColor: "divider", mb: 2 }} />

        <Paper elevation={3} sx={{ p: 3 }}>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            mb={2}
          >
            <Typography variant="h6" fontWeight={600}>
              Your Fridge
            </Typography>
            <Stack direction="row" spacing={1}>
              <Button variant="outlined" startIcon={<ReceiptLongIcon />} onClick={handleOpenUpload}>
                Upload Receipt
              </Button>
              <Button variant="contained" onClick={handleOpenDialog}>
                + Add Food
              </Button>
            </Stack>
          </Stack>

          <TextField
            label="Search your fridge"
            variant="outlined"
            size="small"
            fullWidth
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ mb: 2 }}
          />

          {(error || receiptError) && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error || receiptError}
            </Alert>
          )}

          {itemsLoading ? (
            <Typography color="text.secondary">Loading items…</Typography>
          ) : items.length === 0 ? (
            <Typography color="text.secondary">
              No items yet. Add your first food item!
            </Typography>
          ) : filteredItems.length === 0 ? (
            <Typography color="text.secondary">
              No matches found for your search.
            </Typography>
          ) : (
            <Stack
              divider={
                <Box
                  sx={{ borderBottom: "1px solid", borderColor: "divider" }}
                />
              }
            >
              {filteredItems.map((item) => {
                const expiryColor = getExpiryColor(item.expiryDate);
                const expiryStyles = getExpiryLabelStyles(expiryColor);

                return (
                  <Box
                    key={item.id}
                    sx={{
                      py: 1.5,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography fontWeight={500} sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.itemName}</Typography>

                      <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5 }}>
                        <Typography variant="body2" color="text.secondary">
                          {getExpiryCountdownText(item.expiryDate)}
                        </Typography>

                        <Box
                          sx={{
                            px: 1,
                            py: 0.25,
                            borderRadius: "999px",
                            fontSize: "0.75rem",
                            fontWeight: 600,
                            backgroundColor: expiryStyles.bg,
                            color: expiryStyles.text,
                          }}
                        >
                          {expiryColor === "red"
                            ? "Expired"
                            : expiryColor === "yellow"
                            ? "Soon"
                            : "Fresh"}
                        </Box>
                      </Stack>
                    </Box>

                    <Box>
                      <IconButton
                        aria-label={`Edit ${item.itemName}`}
                        onClick={() => handleOpenEdit(item)}
                      >
                        <EditIcon />
                      </IconButton>

                      <IconButton
                        aria-label={`Delete ${item.itemName}`}
                        onClick={() => handleDelete(item.id)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </Box>
                );
              })}
            </Stack>
          )}
        </Paper>

        {showPendingList && pendingItems.length > 0 && (
          <PendingItemsForm
            pendingItems={pendingItems}
            onUpdate={handleUpdatePendingItem}
            onRemove={handleRemovePendingItem}
            onSave={handleSaveToFridge}
          />
        )}
      </Stack>

      <Dialog open={uploadModalOpen} onClose={handleCloseUpload} maxWidth="sm" fullWidth>
        <DialogTitle>Upload Groceries Receipt</DialogTitle>
        <DialogContent>
          <Stack spacing={2} alignItems="center" py={2}>
            <Typography variant="body2" color="text.secondary">
              Scan with your phone to open camera, or upload an image below.
            </Typography>
            {uploadUrl && (
              <Box sx={{ bgcolor: "white", p: 2, borderRadius: 2 }}>
                <QRCodeSVG value={uploadUrl} size={180} level="M" />
              </Box>
            )}
            <Button variant="outlined" component="label">
              {isMobileUpload() ? "Take photo" : "Upload image"}
              <input
                type="file"
                accept="image/*"
                capture="environment"
                hidden
                onChange={handleFileSelect}
                disabled={ocrProcessing}
              />
            </Button>
          </Stack>
        </DialogContent>
      </Dialog>

      {(ocrProcessing || waitingForPhoneResult) && <ReceiptProcessingOverlay />}

      <Dialog
          open={isDialogOpen}
          onClose={handleCloseDialog}
          fullWidth
          maxWidth="sm"
        >
          <DialogTitle>Add Food Item</DialogTitle>
          <DialogContent sx={{ pt: 2 }}>
            <Stack spacing={2} mt={1}>
              <TextField
                label="Food name"
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                fullWidth
              />
              <DatePicker
                label="Expiry date"
                value={newItemExpiry}
                onChange={(date) => setNewItemExpiry(date)}
                slotProps={{ textField: { fullWidth: true } }}
              />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button variant="contained" onClick={handleAdd}>
              Save
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog open={!!editItem} onClose={handleCloseEdit} fullWidth maxWidth="sm">
          <DialogTitle>Edit Food Item</DialogTitle>
          <DialogContent sx={{ pt: 2 }}>
            <Stack spacing={2} mt={1}>
              <TextField
                label="Food name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                fullWidth
              />
              <DatePicker
                label="Expiry date"
                value={editExpiry}
                onChange={(date) => setEditExpiry(date)}
                slotProps={{ textField: { fullWidth: true } }}
              />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={handleCloseEdit}>Cancel</Button>
            <Button variant="contained" onClick={handleSaveEdit}>
              Update
            </Button>
          </DialogActions>
        </Dialog>
    </Container>
    </LocalizationProvider>
  );
}

export default function UserHome() {
  return (
    <Suspense fallback={<Box sx={{ p: 4, textAlign: "center" }}>Loading…</Box>}>
      <UserHomeContent />
    </Suspense>
  );
}
