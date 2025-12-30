from decimal import Decimal
from django.db import transaction
from django.db.models import F
from rest_framework.exceptions import ValidationError

from apps.inventory.models import InventoryItem
from apps.menu.models import RecipeItem
from .models import Order


@transaction.atomic
def consume_inventory_for_order(order: Order):
    """
    Noraksta noliktavas vienības pēc pasūtījuma receptēm.
    Izpildām tikai tad, kad pasūtījums kļūst 'Pabeigts'.
    Ja noliktavā nepietiek - atgriež P_010 un neveic nekādas izmaiņas.
    """
    # Savācam kopējo patēriņu: inventory_item_id -> total_amount_to_consume
    required: dict[int, Decimal] = {}

    order_items = order.items.select_related("product").all()

    for oi in order_items:
        recipe_items = RecipeItem.objects.filter(product=oi.product).all()
        if recipe_items.count() == 0:
            # Ja produktam nav receptes, tas ir datu integritātes pārkāpums
            raise ValidationError({"code": "P_010", "detail": "Produkts bez receptes. Nevar pabeigt pasūtījumu."})

        for ri in recipe_items:
            need = (ri.amount * oi.quantity)  # amount per 1 product * quantity ordered
            required[ri.inventory_item_id] = required.get(ri.inventory_item_id, Decimal("0")) + need

    # Lock noliktavas rindas, lai nebūtu race condition
    inv_qs = (
        InventoryItem.objects
        .select_for_update()
        .filter(company_id=order.company_id, id__in=required.keys())
    )

    inv_map = {x.id: x for x in inv_qs}

    # Pārbauda, vai visas nepieciešamās vienības eksistē un pietiek
    for inv_id, need in required.items():
        item = inv_map.get(inv_id)
        if not item:
            raise ValidationError({"code": "P_010", "detail": "Noliktavas vienība nav atrasta."})
        if item.quantity < need:
            raise ValidationError({"code": "P_010", "detail": "Nepietiek noliktavas atlikuma pasūtījuma pabeigšanai."})

    # Noraksta noliktavu
    for inv_id, need in required.items():
        InventoryItem.objects.filter(id=inv_id).update(quantity=F("quantity") - need)
