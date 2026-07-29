/** Shared currency options for dropdowns across the app. */

export const CURRENCY_OPTIONS = [
  { value: "INR", label: "INR (₹)" },
  { value: "USD", label: "USD ($)" },
  { value: "EUR", label: "EUR (€)" },
  { value: "GBP", label: "GBP (£)" },
  { value: "AED", label: "AED (د.إ)" },
  { value: "SGD", label: "SGD (S$)" },
  { value: "JPY", label: "JPY (¥)" },
  { value: "CNY", label: "CNY (¥)" },
];

export const CURRENCY_CODES = CURRENCY_OPTIONS.map((c) => c.value);
