"use client";
import {
  Box,
  Button,
  IconButton,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers";
import DeleteIcon from "@mui/icons-material/Delete";
import type { PendingItem } from "@/lib/receipt";

type PendingItemsFormProps = {
  pendingItems: PendingItem[];
  onUpdate: (idx: number, field: "itemName" | "expiryDate", value: string | import("dayjs").Dayjs | null) => void;
  onRemove: (idx: number) => void;
  onSave: () => void;
  title?: string;
  saveLabel?: string;
  extraAction?: React.ReactNode;
  datePickerMinWidth?: number;
  useIconButton?: boolean;
};

export default function PendingItemsForm({
  pendingItems,
  onUpdate,
  onRemove,
  onSave,
  title = "Items from receipt — edit & save",
  saveLabel = "Save to Fridge",
  extraAction,
  datePickerMinWidth = 160,
  useIconButton = true,
}: PendingItemsFormProps) {
  return (
    <Paper elevation={3} sx={{ p: 3 }}>
      <Typography variant="h6" fontWeight={600} mb={2}>
        {title}
      </Typography>
      <Stack spacing={2}>
        {pendingItems.map((p, idx) => (
          <Stack key={idx} direction="row" spacing={2} alignItems="center">
            <TextField
              label="Item"
              value={p.itemName}
              onChange={(e) => onUpdate(idx, "itemName", e.target.value)}
              size="small"
              sx={{ flex: 1 }}
            />
            <DatePicker
              label="Expiry"
              value={p.expiryDate}
              onChange={(d) => onUpdate(idx, "expiryDate", d)}
              slotProps={{ textField: { size: "small", sx: { minWidth: datePickerMinWidth } } }}
            />
            {useIconButton ? (
              <IconButton size="small" onClick={() => onRemove(idx)}>
                <DeleteIcon />
              </IconButton>
            ) : (
              <Button size="small" onClick={() => onRemove(idx)}>
                <DeleteIcon />
              </Button>
            )}
          </Stack>
        ))}
      </Stack>
      <Button variant="contained" onClick={onSave} sx={{ mt: 2 }} fullWidth>
        {saveLabel}
      </Button>
      {extraAction && <Box sx={{ mt: 1 }}>{extraAction}</Box>}
    </Paper>
  );
}
