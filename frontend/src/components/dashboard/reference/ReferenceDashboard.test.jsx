import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import ReferenceDashboard from "./ReferenceDashboard";

const mockT = vi.fn((key) => key);

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: mockT }),
}));

const mockUseAuth = vi.fn();
vi.mock("../../../hooks/useAuth", () => ({
  default: () => mockUseAuth(),
}));

const mockGetErpDashboard = vi.fn();
vi.mock("../../../api/dashboardApi", () => ({
  getErpDashboard: () => mockGetErpDashboard(),
}));

vi.mock("recharts", () => {
  const React = require("react");
  const Mock = ({ children }) => <div data-testid="recharts-mock">{children}</div>;
  return {
    ResponsiveContainer: Mock,
    LineChart: Mock,
    CartesianGrid: Mock,
    XAxis: Mock,
    YAxis: Mock,
    Tooltip: Mock,
    Legend: Mock,
    Line: Mock,
    PieChart: Mock,
    Pie: Mock,
    Cell: Mock,
  };
});

describe("ReferenceDashboard", () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue({
      user: {
        role: "Store Manager",
        permissions: ["dashboard", "inventory", "procurement", "alerts"],
      },
    });
    mockGetErpDashboard.mockResolvedValue({ data: null });
  });

  it("renders the full dashboard layout for a role with limited permissions", async () => {
    render(
      <MemoryRouter>
        <ReferenceDashboard />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("refDashboard.productionOverview")).toBeInTheDocument();
    });

    expect(screen.getByText("refDashboard.ordersOverview")).toBeInTheDocument();
    expect(screen.getByText("refDashboard.inventorySummary")).toBeInTheDocument();
    expect(screen.getByText("refDashboard.alertsNotifications")).toBeInTheDocument();
    expect(screen.getByText("refDashboard.quickActions")).toBeInTheDocument();
  });

  it("hides Quick Actions, Shop Floor, Top Machines, and Inventory Summary for Operator role", async () => {
    mockUseAuth.mockReturnValue({
      user: {
        role: "Operator",
        permissions: ["production"],
      },
    });

    render(
      <MemoryRouter>
        <ReferenceDashboard />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("refDashboard.productionOverview")).toBeInTheDocument();
    });

    expect(screen.queryByText("refDashboard.shopFloorStatus")).not.toBeInTheDocument();
    expect(screen.queryByText("refDashboard.topMachines")).not.toBeInTheDocument();
    expect(screen.queryByText("refDashboard.inventorySummary")).not.toBeInTheDocument();
    expect(screen.queryByText("refDashboard.quickActions")).not.toBeInTheDocument();
  });
});
