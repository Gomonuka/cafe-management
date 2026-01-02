import pytest
from rest_framework.exceptions import ValidationError
from apps.menu.utils import parse_recipe


def test_parse_recipe_from_str():
    data = {"recipe": '[{"inventory_item":1,"amount":2}]'}
    result = parse_recipe(data)
    assert isinstance(result, list)
    assert result[0]["inventory_item"] == 1


def test_parse_recipe_invalid_json():
    with pytest.raises(ValidationError):
        parse_recipe({"recipe": "not-json"})
