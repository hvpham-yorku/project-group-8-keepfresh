import json
import os
from pathlib import Path

from dotenv import load_dotenv
from openai import OpenAI

load_dotenv(Path(__file__).resolve().parent.parent / ".env")

RECO_PROMPT = """You are a grocery recommendation engine. Given a list of food/grocery item names the user has, return a JSON object with exactly these four keys. Use only common, real grocery product names. Do not invent brands or fake items.

Keys:
- "boughtBefore": array of strings. Include ALL items from the input list that the user might rebuy (staples/repeat purchases). De-duplicate. Up to 20 items.
- "healthierAlternatives": array of objects with "original" and "alternative" (both strings). E.g. [{"original":"milk","alternative":"oat milk"},{"original":"white bread","alternative":"whole grain bread"}]. 3–6 pairs. Each "original" must be from the input list.
- "cheaperAlternatives": array of objects with "original" and "alternative". 3–6 pairs. E.g. [{"original":"name-brand cereal","alternative":"store brand cereal"}].
- "buyBecauseYouBought": array of objects with "buy" and "because" (both strings). "buy"=recommended item, "because"=item from input that motivates it. E.g. [{"buy":"butter","because":"bread"},{"buy":"cheese","because":"eggs"}]. 3–6 pairs.

Rules: Return only valid JSON. If input list is empty, return empty arrays/objects. No other keys."""


def get_recommendations(item_names: list[str]) -> dict:
    """Call LLM to get recommendation lists. item_names: list of itemName strings from user's fridge."""
    api_key = os.getenv("OPEN_API_KEY")
    if not api_key:
        raise ValueError("OPEN_API_KEY not set")

    client = OpenAI(api_key=api_key)
    input_list = ", ".join(item_names) if item_names else "(no items)"

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {
                "role": "user",
                "content": f"User's current items: {input_list}\n\n{RECO_PROMPT}",
            }
        ],
        max_tokens=2048,
        response_format={"type": "json_object"},
    )

    raw = response.choices[0].message.content.strip()
    data = json.loads(raw)

    def ensure_list_strings(key: str) -> list:
        val = data.get(key)
        if not isinstance(val, list):
            return []
        return [str(x).strip() for x in val if x]

    def ensure_list_dicts(key: str, keys: tuple[str, str]) -> list[dict]:
        val = data.get(key)
        if not isinstance(val, list):
            return []
        out = []
        for x in val:
            if not isinstance(x, dict):
                continue
            a, b = x.get(keys[0]), x.get(keys[1])
            if a and b:
                out.append({keys[0]: str(a).strip(), keys[1]: str(b).strip()})
        return out

    return {
        "boughtBefore": ensure_list_strings("boughtBefore"),
        "healthierAlternatives": ensure_list_dicts("healthierAlternatives", ("original", "alternative")),
        "cheaperAlternatives": ensure_list_dicts("cheaperAlternatives", ("original", "alternative")),
        "buyBecauseYouBought": ensure_list_dicts("buyBecauseYouBought", ("buy", "because")),
    }
