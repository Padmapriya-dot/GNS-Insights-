import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import ReferenceDashboard from "./ReferenceDashboard";

const mockT = vi.fn((key, fallback) => fallback || key);

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
        roles: ["Store Manager"],
        permissions: ["dashboard", "inventory", "procurement", "sales", "alerts"],
      },
    });
    mockGetErpDashboard.mockResolvedValue({
      data: {
        dashboard_profile: "store",
        visible_sections: ["kpi", "orders_overview", "inventory", "alerts", "quick_actions", "todays_summary"],
        kpi_cards: [
          { id: "inventory-value", title: "Inventory Value", value: "₹0", trend: "0%", trendUp: true, trendLabel: "vs last 7 days" },
          { id: "low-stock", title: "Low Stock Items", value: "0", trend: "0%", trendUp: false, trendLabel: "vs last 7 days" },
        ],
        inventory_blocks: [],
        warehouse_locations: [],
        alerts_feed: [],
        orders_overview: { total: 0, inProgress: 0, completed: 0, onHold: 0, progress: 0 },
        todays_summary: [],
        production_overview: [],
        shop_floor_status: [],
        top_machines: [],
        recent_work_orders: [],
      },
    });
  });

  it("shows store KPIs and hides production sections for Store Manager", async () => {
    render(
      <MemoryRouter>
        <ReferenceDashboard />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("refDashboard.inventoryValue")).toBeInTheDocument();
    });

    expect(screen.getByText("refDashboard.lowStockItems")).toBeInTheDocument();
    expect(screen.getByText("Store Operations")).toBeInTheDocument();
    expect(screen.getByText("refDashboard.inventorySummary")).toBeInTheDocument();
    expect(screen.queryByText("refDashboard.productionOverview")).not.toBeInTheDocument();
    expect(screen.queryByText("refDashboard.shopFloorStatus")).not.toBeInTheDocument();
    expect(screen.queryByText("refDashboard.todaysProduction")).not.toBeInTheDocument();
    expect(screen.queryByText("refDashboard.machinesRunning")).not.toBeInTheDocument();
  });
});
