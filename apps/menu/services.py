# apps/menu/services.py
from __future__ import annotations

from decimal import Decimal
from typing import Iterable

from apps.inventory.models import InventoryItem
from .models import Product, RecipeItem

def compute_available_quantities(products: Iterable[Product]) -> dict[int, int]:
    """
    Aprēķina katras preces vienību skaitu, ko var veikt, pamatojoties uz pašreizējiem krājumiem.
    Atgriež kartēšanas PRODUCT_ID - > available_count (vesels skaitlis, > = 0).
    """
    product_list = list(products)
    if not product_list:
        return {}

    product_ids = [p.id for p in product_list]
    # Prefetch receptes rindas ar krājumu daudzumiem, lai minimizētu vaicājumus.
    recipes = (
        RecipeItem.objects.select_related("inventory_item")
        .filter(product_id__in=product_ids)
        .order_by("product_id")
    )

    available: dict[int, int] = {pid: 0 for pid in product_ids}

    # Veidojiet katra produkta min (daudzums// daudzums) dažādās sastāvdaļās.
    per_product_values: dict[int, list[int]] = {pid: [] for pid in product_ids}
    for ri in recipes:
        if not ri.inventory_item:
            continue
        qty: Decimal = ri.inventory_item.quantity or Decimal("0")
        # Izvairieties no dalīšanas ar nulli; nederīgas receptes tiek uzskatītas par nepieejamām.
        if ri.amount is None or ri.amount <= 0:
            per_product_values.setdefault(ri.product_id, []).append(0)
            continue
        per_product_values.setdefault(ri.product_id, []).append(int(qty // ri.amount))

    for pid, vals in per_product_values.items():
        if vals:
            available[pid] = min(vals)
        else:
            # Ja recepte nav norādīta, uzskatām, ka nevar pagatavot (publiskai attēlošanai).
            available[pid] = 0

    return available
