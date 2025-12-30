import json
from rest_framework.exceptions import ValidationError

def parse_working_hours(data):
    """
    Pārvērš darba laikus no FormData (string) uz Python list.
    FE parasti sūta working_hours kā JSON string.
    """
    wh = data.get("working_hours")

    # Ja jau ir list (piem., tīrs JSON request), atgriežam kā ir
    if isinstance(wh, list):
        return wh

    # Ja ir string, mēģinām parse
    if isinstance(wh, str):
        try:
            return json.loads(wh)
        except json.JSONDecodeError:
            raise ValidationError({"working_hours": "Darba laiki nav korektā JSON formātā."})

    raise ValidationError({"working_hours": "Darba laiki ir obligāti."})
