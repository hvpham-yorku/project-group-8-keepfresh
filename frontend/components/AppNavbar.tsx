import Link from "next/link";
import { AppBar, Button, Stack, Toolbar, Typography } from "@mui/material";

export default function AppNavbar() {
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
          >
            Logout
          </Button>
        </Stack>
      </Toolbar>
    </AppBar>
  );
}
