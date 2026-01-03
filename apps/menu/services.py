from __future__ import annotations

from decimal import Decimal
from typing import Iterable

from apps.inventory.models import InventoryItem
from .models import Product, RecipeItem


def compute_available_quantities(products: Iterable[Product]) -> dict[int, int]:
    """
    Calculates how many units of each product can be made based on current inventory.
    Returns mapping product_id -> available_count (integer, >=0).
    """
    product_list = list(products)
    if not product_list:
        return {}

    product_ids = [p.id for p in product_list]
    # Prefetch recipe rows with inventory quantities to minimize queries.
    recipes = (
        RecipeItem.objects.select_related("inventory_item")
        .filter(product_id__in=product_ids)
        .order_by("product_id")
    )

    available: dict[int, int] = {pid: 0 for pid in product_ids}

    # Build per-product min(quantity // amount) across ingredients.
    per_product_values: dict[int, list[int]] = {pid: [] for pid in product_ids}
    for ri in recipes:
        if not ri.inventory_item:
            continue
        qty: Decimal = ri.inventory_item.quantity or Decimal("0")
        # Avoid division by zero; invalid recipes are treated as unavailable.
        if ri.amount is None or ri.amount <= 0:
            per_product_values.setdefault(ri.product_id, []).append(0)
            continue
        per_product_values.setdefault(ri.product_id, []).append(int(qty // ri.amount))

    for pid, vals in per_product_values.items():
        # If a product has no recipe rows or any zero divider, treat availability as 0.
        available[pid] = min(vals) if vals else 0

    return available
