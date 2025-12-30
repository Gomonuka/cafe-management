import json
from rest_framework.exceptions import ValidationError


def parse_recipe(data):
    """
    Parsē recepti no FormData (string) uz list.
    FE parasti sūta 'recipe' kā JSON string.
    """
    recipe = data.get("recipe")

    if isinstance(recipe, list):
        return recipe

    if isinstance(recipe, str):
        try:
            return json.loads(recipe)
        except json.JSONDecodeError:
            raise ValidationError({"recipe": "Recepte nav korektā JSON formātā."})

    raise ValidationError({"recipe": "Recepte ir obligāta."})
