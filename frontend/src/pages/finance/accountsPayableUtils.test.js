import { describe, expect, it } from "vitest";

import { normalizeListPayload, normalizeSummaryPayload } from "./accountsPayableUtils";

describe("accounts payable API helpers", () => {
  it("normalizes wrapped array payloads", () => {
    expect(normalizeListPayload({ data: [{ id: 1 }, { id: 2 }] })).toEqual([{ id: 1 }, { id: 2 }]);
  });

  it("normalizes summary payloads from the backend", () => {
    expect(
      normalizeSummaryPayload({
        data: {
          outstanding_payables: 1250,
          due_this_week: 3,
          overdue_bills: 2,
          paid_this_month: 4000,
          pending_approvals: 1,
          vendor_count: 7,
        },
      })
    ).toMatchObject({
      outstanding_payables: 1250,
      due_this_week: 3,
      overdue_bills: 2,
      paid_this_month: 4000,
      pending_approvals: 1,
      vendor_count: 7,
    });
  });
});
