"""Indian Rupee amount to words."""

ONES = [
    "",
    "One",
    "Two",
    "Three",
    "Four",
    "Five",
    "Six",
    "Seven",
    "Eight",
    "Nine",
    "Ten",
    "Eleven",
    "Twelve",
    "Thirteen",
    "Fourteen",
    "Fifteen",
    "Sixteen",
    "Seventeen",
    "Eighteen",
    "Nineteen",
]
TENS = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"]


def _two(n: int) -> str:
    if n < 20:
        return ONES[n]
    return f"{TENS[n // 10]}{' ' + ONES[n % 10] if n % 10 else ''}".strip()


def _three(n: int) -> str:
    if n == 0:
        return ""
    if n < 100:
        return _two(n)
    return f"{ONES[n // 100]} Hundred{' ' + _two(n % 100) if n % 100 else ''}".strip()


def number_to_words_inr(amount: float) -> str:
    n = round(float(amount) * 100) / 100
    rupees = int(n)
    paise = int(round((n - rupees) * 100))

    if rupees == 0 and paise == 0:
        return "Indian Rupees Zero Only"

    crore = rupees // 10000000
    lakh = (rupees % 10000000) // 100000
    thousand = (rupees % 100000) // 1000
    rest = rupees % 1000

    parts = []
    if crore:
        parts.append(f"{_two(crore)} Crore")
    if lakh:
        parts.append(f"{_two(lakh)} Lakh")
    if thousand:
        parts.append(f"{_two(thousand)} Thousand")
    if rest:
        parts.append(_three(rest))

    words = f"Indian Rupees {' '.join(parts)}".strip()
    if paise:
        words += f" and {_two(paise)} Paise"
    return f"{words} Only"
