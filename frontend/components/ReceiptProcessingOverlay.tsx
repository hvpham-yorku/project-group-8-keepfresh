import { Box, CircularProgress, Stack, Typography } from "@mui/material";

export default function ReceiptProcessingOverlay() {
  return (
    <Box
      sx={{
        position: "fixed",
        inset: 0,
        bgcolor: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
      }}
    >
      <Stack alignItems="center" spacing={2}>
        <CircularProgress size={48} sx={{ color: "white" }} />
        <Typography color="white">Processing receipt…</Typography>
      </Stack>
    </Box>
  );
}
