"use client";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Chip,
  Container,
  Paper,
  Skeleton,
  Stack,
  Typography,
} from "@mui/material";
import LightbulbOutlinedIcon from "@mui/icons-material/LightbulbOutlined";
import ReplayIcon from "@mui/icons-material/Replay";
import LocalFloristIcon from "@mui/icons-material/LocalFlorist";
import SavingsIcon from "@mui/icons-material/Savings";
import AddShoppingCartIcon from "@mui/icons-material/AddShoppingCart";
import { API_BASE } from "@/lib/api";

type AltMapping = { original: string; alternative: string };
type BuyMapping = { buy: string; because: string };

type Recommendations = {
  boughtBefore: string[];
  healthierAlternatives: AltMapping[] | string[];
  cheaperAlternatives: AltMapping[] | string[];
  buyBecauseYouBought: BuyMapping[] | string[];
} | null;

function isAltMapping(x: AltMapping | string): x is AltMapping {
  return typeof x === "object" && x !== null && "original" in x && "alternative" in x;
}

function isBuyMapping(x: BuyMapping | string): x is BuyMapping {
  return typeof x === "object" && x !== null && "buy" in x && "because" in x;
}

function CategoryCard({
  title,
  items,
  icon: Icon,
  color,
}: {
  title: string;
  items: string[];
  icon: React.ElementType;
  color: string;
}) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 2.5,
        borderRadius: 2,
        border: "1px solid",
        borderColor: "divider",
        bgcolor: "grey.50",
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 1.5 }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 40,
            height: 40,
            borderRadius: 2,
            bgcolor: color,
            color: "white",
          }}
        >
          <Icon sx={{ fontSize: 22 }} />
        </Box>
        <Typography variant="subtitle1" fontWeight={700} color="text.primary">
          {title}
        </Typography>
      </Stack>
      {items.length > 0 ? (
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
          {items.map((item) => (
            <Chip
              key={item}
              label={item.toUpperCase()}
              size="medium"
              sx={{
                bgcolor: "white",
                border: "1px solid",
                borderColor: "divider",
                fontWeight: 500,
                textTransform: "uppercase",
              }}
            />
          ))}
        </Box>
      ) : (
        <Typography variant="body2" color="text.secondary">
          —
        </Typography>
      )}
    </Paper>
  );
}

function MappingCard({
  title,
  mappings,
  chipLabel,
  suffix,
  icon: Icon,
  color,
}: {
  title: string;
  mappings: AltMapping[] | BuyMapping[];
  chipLabel: (m: AltMapping | BuyMapping) => string;
  suffix: (m: AltMapping | BuyMapping) => string;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 2.5,
        borderRadius: 2,
        border: "1px solid",
        borderColor: "divider",
        bgcolor: "grey.50",
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 1.5 }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 40,
            height: 40,
            borderRadius: 2,
            bgcolor: color,
            color: "white",
          }}
        >
          <Icon sx={{ fontSize: 22 }} />
        </Box>
        <Typography variant="subtitle1" fontWeight={700} color="text.primary">
          {title}
        </Typography>
      </Stack>
      {mappings.length > 0 ? (
        <Stack spacing={1.5}>
          {mappings.map((m, i) => (
            <Box
              key={i}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                flexWrap: "wrap",
                py: 0.75,
                px: 1.5,
                borderRadius: 1.5,
                bgcolor: "white",
                border: "1px solid",
                borderColor: "divider",
              }}
            >
              <Chip
                label={String(chipLabel(m)).toUpperCase()}
                size="medium"
                sx={{
                  bgcolor: "grey.100",
                  border: "none",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.02em",
                }}
              />
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                {suffix(m)}
              </Typography>
            </Box>
          ))}
        </Stack>
      ) : (
        <Typography variant="body2" color="text.secondary">
          —
        </Typography>
      )}
    </Paper>
  );
}

export default function RecommendationsPage() {
  const router = useRouter();
  const [recommendations, setRecommendations] = useState<Recommendations>(null);
  const [loading, setLoading] = useState(true);

  const fetchRecommendations = useCallback(() => {
    const token = localStorage.getItem("user_token");
    if (!token) {
      router.push("/login");
      return;
    }
    setLoading(true);
    fetch(`${API_BASE}/recommendations`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : Promise.reject(res)))
      .then((data) => setRecommendations(data.recommendations ?? null))
      .catch(() => setRecommendations(null))
      .finally(() => setLoading(false));
  }, [router]);

  useEffect(() => {
    const token = localStorage.getItem("user_token");
    if (!token) {
      router.push("/login");
      return;
    }
    fetchRecommendations();
  }, [fetchRecommendations, router]);

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Typography variant="h5" fontWeight={700} sx={{ mb: 3 }}>
          Recommendations
        </Typography>
        <Stack spacing={2}>
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} variant="rounded" height={100} />
          ))}
        </Stack>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" fontWeight={700} sx={{ mb: 0.5 }}>
          Recommendations
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Personalized suggestions based on your fridge
        </Typography>
      </Box>

      {!recommendations ? (
        <Paper
          elevation={0}
          sx={{
            p: 4,
            textAlign: "center",
            border: "1px dashed",
            borderColor: "divider",
            borderRadius: 2,
          }}
        >
          <LightbulbOutlinedIcon sx={{ fontSize: 48, color: "text.disabled", mb: 1 }} />
          <Typography color="text.secondary" sx={{ mb: 2 }}>
            Add some items to your fridge to get personalized recommendations.
          </Typography>
        </Paper>
      ) : (
        <Stack spacing={3}>
          <CategoryCard
            title="Bought Before"
            items={Array.isArray(recommendations.boughtBefore) ? recommendations.boughtBefore : []}
            icon={ReplayIcon}
            color="#6366f1"
          />
          {recommendations.healthierAlternatives?.length > 0 && isAltMapping(recommendations.healthierAlternatives[0]) ? (
            <MappingCard
              title="Healthier Alternatives"
              mappings={recommendations.healthierAlternatives as AltMapping[]}
              chipLabel={(m) => (m as AltMapping).alternative}
              suffix={(m) => `replaces ${(m as AltMapping).original.toUpperCase()}`}
              icon={LocalFloristIcon}
              color="#10b981"
            />
          ) : (
            <CategoryCard
              title="Healthier Alternatives"
              items={Array.isArray(recommendations.healthierAlternatives) ? (recommendations.healthierAlternatives as string[]) : []}
              icon={LocalFloristIcon}
              color="#10b981"
            />
          )}
          {recommendations.cheaperAlternatives?.length > 0 && isAltMapping(recommendations.cheaperAlternatives[0]) ? (
            <MappingCard
              title="Cheaper Alternatives"
              mappings={recommendations.cheaperAlternatives as AltMapping[]}
              chipLabel={(m) => (m as AltMapping).alternative}
              suffix={(m) => `replaces ${(m as AltMapping).original.toUpperCase()}`}
              icon={SavingsIcon}
              color="#f59e0b"
            />
          ) : (
            <CategoryCard
              title="Cheaper Alternatives"
              items={Array.isArray(recommendations.cheaperAlternatives) ? (recommendations.cheaperAlternatives as string[]) : []}
              icon={SavingsIcon}
              color="#f59e0b"
            />
          )}
          {recommendations.buyBecauseYouBought?.length > 0 && isBuyMapping(recommendations.buyBecauseYouBought[0]) ? (
            <MappingCard
              title="Often bought with"
              mappings={recommendations.buyBecauseYouBought as BuyMapping[]}
              chipLabel={(m) => (m as BuyMapping).buy}
              suffix={(m) => `pairs with ${(m as BuyMapping).because.toUpperCase()}`}
              icon={AddShoppingCartIcon}
              color="#2563eb"
            />
          ) : (
            <CategoryCard
              title="Often bought with"
              items={Array.isArray(recommendations.buyBecauseYouBought) ? (recommendations.buyBecauseYouBought as string[]) : []}
              icon={AddShoppingCartIcon}
              color="#2563eb"
            />
          )}
        </Stack>
      )}
    </Container>
  );
}
