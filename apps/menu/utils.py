# apps/menu/utils.py
import json
import re
from rest_framework.exceptions import ValidationError

def _parse_flat_recipe_fields(data):
    """
    Fallback: extract recipe rows from flat keys like recipe[0][inventory_item_id].
    """
    pattern = re.compile(r"^recipe\[(\d+)\]\[(inventory_item_id|amount)\]$")
    tmp = {}
    for key, value in data.items():
        m = pattern.match(key)
        if not m:
            continue
        idx, field = m.groups()
        row = tmp.setdefault(int(idx), {})
        row[field] = value
    if not tmp:
        return None
    return [row for _, row in sorted(tmp.items(), key=lambda x: x[0])]


def parse_recipe(data):
    """
    Parsē recepti no FormData (JSON string vai flat lauki) uz list.
    """
    recipe = data.get("recipe")

    if isinstance(recipe, list):
        return recipe

    if isinstance(recipe, str):
        try:
            return json.loads(recipe)
        except json.JSONDecodeError:
            raise ValidationError({"recipe": "Recepte nav korektā JSON formātā."})

    flat = _parse_flat_recipe_fields(data)
    if flat is not None:
        return flat

    # Ja recepte nav norādīta, atgriežam tukšu sarakstu (izveidi atļaujam bez receptes)
    return []
