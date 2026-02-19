import Link from "next/link";
import {
  Button,
  Card,
  CardActions,
  CardContent,
  Container,
  Stack,
  Typography,
} from "@mui/material";

export default function Home() {
  return (
    <Container
      maxWidth="md"
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Card
        elevation={3}
        sx={{
          px: 6,
          py: 5,
          textAlign: "center",
        }}
      >
        <CardContent>
          <Typography variant="h3" component="h1" fontWeight={700} gutterBottom>
            KeepFresh
          </Typography>
          <Typography color="text.secondary">
            Welcome to KeepFresh! Track what&apos;s in your fridge and avoid
            waste.
          </Typography>
        </CardContent>
        <CardActions sx={{ justifyContent: "center", mt: 2 }}>
          <Stack direction="row" spacing={2}>
            <Button
              component={Link}
              href="/login"
              variant="contained"
              color="primary"
              size="large"
            >
              Go to Login
            </Button>
            <Button
              component={Link}
              href="/signup"
              variant="outlined"
              color="primary"
              size="large"
            >
              Go to Sign Up
            </Button>
          </Stack>
        </CardActions>
      </Card>
    </Container>
  );
}
