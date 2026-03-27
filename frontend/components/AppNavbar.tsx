"use client";

import Link from "next/link";
import { AppBar, Button, Stack, Toolbar, Typography } from "@mui/material";

// Top nav; logout clears local session keys before navigating to /login.
export default function AppNavbar() {
  const handleLogoutClick = () => {
    // Drop token + username so route guards send users to login.
    localStorage.removeItem("user_token");
    localStorage.removeItem("username");
  };

  return (
    <AppBar position="static" color="primary" sx={{ bgcolor: "#2563eb" }}>
      <Toolbar sx={{ justifyContent: "space-between" }}>
        <Typography variant="h6" component="div" fontWeight={700}>
          KeepFresh
        </Typography>
        <Stack direction="row" spacing={1}>
          <Button component={Link} href="/userhome" color="inherit">
            Fridge
          </Button>
          <Button component={Link} href="/recommendations" color="inherit">
            Recommendations
          </Button>
          <Button component={Link} href="/profile" color="inherit">
            Profile
          </Button>
          <Button
            component={Link}
            href="/login"
            variant="outlined"
            color="inherit"
            onClick={handleLogoutClick}
          >
            Logout
          </Button>
        </Stack>
      </Toolbar>
    </AppBar>
  );
}
