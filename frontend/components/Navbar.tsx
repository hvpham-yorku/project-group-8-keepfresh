import Link from "next/link";
import { AppBar, Button, Stack, Toolbar, Typography } from "@mui/material";

export default function Navbar() {
  return (
    <AppBar position="static" color="primary" elevation={2}>
      <Toolbar sx={{ justifyContent: "space-between" }}>
        <Typography variant="h6" component="div" fontWeight={700}>
          KeepFresh
        </Typography>
        <Stack direction="row" spacing={1}>
          <Button component={Link} href="/login" color="inherit">
            Login
          </Button>
          <Button
            component={Link}
            href="/signup"
            variant="outlined"
            color="inherit"
          >
            Sign Up
          </Button>
        </Stack>
      </Toolbar>
    </AppBar>
  );
}
