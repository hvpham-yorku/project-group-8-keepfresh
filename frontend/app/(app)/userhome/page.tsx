"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
import dayjs, { Dayjs } from "dayjs";

type Item = {
  id: string;
  itemName: string;
  expiryDate: string; // YYYY-MM-DD format
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

export default function UserHome() {
  const router = useRouter();

  const [username, setUsername] = useState<string>("");
  const [items, setItems] = useState<Item[]>([]);
  const [itemsLoading, setItemsLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newItemName, setNewItemName] = useState("");
  const [newItemExpiry, setNewItemExpiry] = useState<Dayjs | null>(null);
  const [editItem, setEditItem] = useState<Item | null>(null);
  const [editName, setEditName] = useState("");
  const [editExpiry, setEditExpiry] = useState<Dayjs | null>(null);

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

  useEffect(() => {
    const token = localStorage.getItem("user_token");
    if (!token) return;
    setItemsLoading(true);
    fetch("http://localhost:8000/items", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : Promise.reject(res)))
      .then((data) => setItems(data.items ?? []))
      .catch(() => setItems([]))
      .finally(() => setItemsLoading(false));
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

    fetch("http://localhost:8000/items", {
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
    const token = localStorage.getItem("user_token");
    if (!token) return;
    fetch(`http://localhost:8000/items/${id}`, {
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
    fetch(`http://localhost:8000/items/${editItem.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
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

  const handleLogout = () => {
    localStorage.removeItem("username");
    localStorage.removeItem("user_token");
    router.push("/login");
  };

  const sortedItems = [...items].sort((a, b) => {
  return dayjs(a.expiryDate).valueOf() - dayjs(b.expiryDate).valueOf();
  });

  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      <Stack spacing={3}>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
        >
          <Box>
            <Typography variant="h4" fontWeight={700}>
              Welcome back, {username || "friend"}!
            </Typography>
            <Typography color="text.secondary">
              Here’s your current fridge.
            </Typography>
          </Box>
          <Button variant="outlined" color="inherit" onClick={handleLogout}>
            Logout
          </Button>
        </Stack>

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
            <Button variant="contained" onClick={handleOpenDialog}>
              + Add Food
            </Button>
          </Stack>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {itemsLoading ? (
            <Typography color="text.secondary">Loading items…</Typography>
          ) : items.length === 0 ? (
            <Typography color="text.secondary">
              No items yet. Add your first food item!
            </Typography>
          ) : (
            <Stack
              divider={
                <Box
                  sx={{ borderBottom: "1px solid", borderColor: "divider" }}
                />
              }
            >
              {sortedItems.map((item) => {
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
                    <Box>
                      <Typography fontWeight={500}>{item.itemName}</Typography>

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
      </Stack>

      <LocalizationProvider dateAdapter={AdapterDayjs}>
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
      </LocalizationProvider>
    </Container>
  );
}
