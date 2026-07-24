"""Indian PIN / postal code address lookup (reusable, no duplicate logic)."""

from __future__ import annotations

import logging
import re

import httpx
from fastapi import HTTPException, status

logger = logging.getLogger(__name__)

# Fallback when external postal API is unreachable (prefix → state/city)
_PIN_PREFIX_FALLBACK: dict[str, dict[str, str]] = {
    "110": {"state": "Delhi", "city": "New Delhi"},
    "121": {"state": "Haryana", "city": "Faridabad"},
    "122": {"state": "Haryana", "city": "Gurugram"},
    "140": {"state": "Punjab", "city": "Mohali"},
    "141": {"state": "Punjab", "city": "Ludhiana"},
    "143": {"state": "Punjab", "city": "Amritsar"},
    "160": {"state": "Chandigarh", "city": "Chandigarh"},
    "201": {"state": "Uttar Pradesh", "city": "Noida"},
    "208": {"state": "Uttar Pradesh", "city": "Kanpur"},
    "221": {"state": "Uttar Pradesh", "city": "Varanasi"},
    "226": {"state": "Uttar Pradesh", "city": "Lucknow"},
    "248": {"state": "Uttarakhand", "city": "Dehradun"},
    "282": {"state": "Uttar Pradesh", "city": "Agra"},
    "302": {"state": "Rajasthan", "city": "Jaipur"},
    "313": {"state": "Rajasthan", "city": "Udaipur"},
    "342": {"state": "Rajasthan", "city": "Jodhpur"},
    "380": {"state": "Gujarat", "city": "Ahmedabad"},
    "390": {"state": "Gujarat", "city": "Vadodara"},
    "395": {"state": "Gujarat", "city": "Surat"},
    "400": {"state": "Maharashtra", "city": "Mumbai"},
    "401": {"state": "Maharashtra", "city": "Thane"},
    "403": {"state": "Goa", "city": "Panaji"},
    "411": {"state": "Maharashtra", "city": "Pune"},
    "440": {"state": "Maharashtra", "city": "Nagpur"},
    "452": {"state": "Madhya Pradesh", "city": "Indore"},
    "462": {"state": "Madhya Pradesh", "city": "Bhopal"},
    "492": {"state": "Chhattisgarh", "city": "Raipur"},
    "500": {"state": "Telangana", "city": "Hyderabad"},
    "501": {"state": "Telangana", "city": "Hyderabad"},
    "506": {"state": "Telangana", "city": "Warangal"},
    "520": {"state": "Andhra Pradesh", "city": "Vijayawada"},
    "530": {"state": "Andhra Pradesh", "city": "Visakhapatnam"},
    "560": {"state": "Karnataka", "city": "Bengaluru"},
    "570": {"state": "Karnataka", "city": "Mysuru"},
    "575": {"state": "Karnataka", "city": "Mangaluru"},
    "600": {"state": "Tamil Nadu", "city": "Chennai"},
    "625": {"state": "Tamil Nadu", "city": "Madurai"},
    "641": {"state": "Tamil Nadu", "city": "Coimbatore"},
    "682": {"state": "Kerala", "city": "Kochi"},
    "695": {"state": "Kerala", "city": "Thiruvananthapuram"},
    "700": {"state": "West Bengal", "city": "Kolkata"},
    "751": {"state": "Odisha", "city": "Bhubaneswar"},
    "781": {"state": "Assam", "city": "Guwahati"},
    "800": {"state": "Bihar", "city": "Patna"},
    "834": {"state": "Jharkhand", "city": "Ranchi"},
}

_STATE_CODES = {
    "Andaman and Nicobar Islands": "35",
    "Andhra Pradesh": "37",
    "Arunachal Pradesh": "12",
    "Assam": "18",
    "Bihar": "10",
    "Chandigarh": "04",
    "Chhattisgarh": "22",
    "Dadra and Nagar Haveli and Daman and Diu": "26",
    "Delhi": "07",
    "Goa": "30",
    "Gujarat": "24",
    "Haryana": "06",
    "Himachal Pradesh": "02",
    "Jammu and Kashmir": "01",
    "Jharkhand": "20",
    "Karnataka": "29",
    "Kerala": "32",
    "Ladakh": "38",
    "Lakshadweep": "31",
    "Madhya Pradesh": "23",
    "Maharashtra": "27",
    "Manipur": "14",
    "Meghalaya": "17",
    "Mizoram": "15",
    "Nagaland": "13",
    "Odisha": "21",
    "Puducherry": "34",
    "Punjab": "03",
    "Rajasthan": "08",
    "Sikkim": "11",
    "Tamil Nadu": "33",
    "Telangana": "36",
    "Tripura": "16",
    "Uttar Pradesh": "09",
    "Uttarakhand": "05",
    "West Bengal": "19",
}

POSTAL_API_URL = "https://api.postalpincode.in/pincode/{pincode}"


def normalize_pincode(value: str | None) -> str:
    return re.sub(r"\D", "", value or "")


def validate_indian_pincode(value: str | None) -> str:
    digits = normalize_pincode(value)
    if len(digits) != 6 or digits[0] == "0":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid PIN Code.",
        )
    return digits


def _fallback_lookup(pincode: str) -> dict | None:
    hit = _PIN_PREFIX_FALLBACK.get(pincode[:3])
    if not hit:
        return None
    state = hit["state"]
    return {
        "pincode": pincode,
        "country": "India",
        "state": state,
        "city": hit["city"],
        "district": hit["city"],
        "state_code": _STATE_CODES.get(state),
        "post_office": None,
        "source": "fallback",
    }


def _from_postal_payload(pincode: str, payload: list) -> dict | None:
    if not payload:
        return None
    first = payload[0] if isinstance(payload, list) else payload
    if not isinstance(first, dict):
        return None
    if str(first.get("Status", "")).lower() != "success":
        return None
    offices = first.get("PostOffice") or []
    if not offices:
        return None
    office = offices[0]
    state = (office.get("State") or "").strip()
    city = (
        (office.get("District") or "").strip()
        or (office.get("Block") or "").strip()
        or (office.get("Name") or "").strip()
    )
    if not state or not city:
        return None
    return {
        "pincode": pincode,
        "country": "India",
        "state": state,
        "city": city,
        "district": (office.get("District") or "").strip() or city,
        "state_code": _STATE_CODES.get(state),
        "post_office": (office.get("Name") or "").strip() or None,
        "source": "postal",
    }


def lookup_indian_pincode(pincode: str) -> dict:
    """
    Resolve Indian PIN → state/city.
    Raises HTTP 400 for invalid PIN, 404 if not found, 503 if service unavailable
    and no fallback match.
    """
    pin = validate_indian_pincode(pincode)

    try:
        with httpx.Client(timeout=6.0) as client:
            resp = client.get(POSTAL_API_URL.format(pincode=pin))
            resp.raise_for_status()
            data = resp.json()
        result = _from_postal_payload(pin, data)
        if result:
            return result
        # Explicit invalid / not found from postal API
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invalid PIN Code.",
        )
    except HTTPException:
        raise
    except Exception as exc:
        logger.warning("PIN lookup service error for %s: %s", pin, exc)
        fallback = _fallback_lookup(pin)
        if fallback:
            return fallback
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Unable to fetch address details. Please try again.",
        ) from exc
