import base64
import json
import os
from pathlib import Path

from dotenv import load_dotenv
from openai import OpenAI

load_dotenv(Path(__file__).resolve().parent.parent / ".env")


def extract_grocery_items(image_bytes: bytes, content_type: str = "image/jpeg") -> list[dict]:
    """Use OpenAI to extract grocery item names from receipt image."""
    api_key = os.getenv("OPEN_API_KEY")
    if not api_key:
        raise ValueError("OPEN_API_KEY not set")

    client = OpenAI(api_key=api_key)
    b64 = base64.standard_b64encode(image_bytes).decode()

    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": """Extract all grocery/food items from this receipt image. Return a JSON array of objects with a single key "itemName" for each item. Example: [{"itemName": "Milk"}, {"itemName": "Bread"}]. Only include actual food/grocery items, no totals or non-food. Return valid JSON only.""",
                    },
                    {
                        "type": "image_url",
                        "image_url": {"url": f"data:{content_type};base64,{b64}"},
                    },
                ],
            }
        ],
        max_tokens=1024,
    )

    content = response.choices[0].message.content
    content = content.strip()
    if content.startswith("```"):
        content = content.split("```")[1]
        if content.startswith("json"):
            content = content[4:]
    content = content.strip()
    items = json.loads(content)
    return items if isinstance(items, list) else [items]
