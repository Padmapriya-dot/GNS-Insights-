from datetime import date

from pydantic import BaseModel


class LeadSummaryRead(BaseModel):
    total_leads: int = 0
    new_leads: int = 0
    qualified_leads: int = 0
    won_customers: int = 0
    lost_leads: int = 0
    conversion_rate: float = 0


class LeadListRead(BaseModel):
    id: int
    lead_id: str
    customer_name: str
    company: str | None = None
    contact: str | None = None
    source: str | None = None
    sales_executive: str | None = None
    priority: str = "medium"
    next_followup: str | None = None
    status: str = "new"
    opportunity_value: float | None = None
    industry: str | None = None
    region: str | None = None


class QuotationSummaryRead(BaseModel):
    total_quotations: int = 0
    draft: int = 0
    sent: int = 0
    accepted: int = 0
    rejected: int = 0
    expired: int = 0


class QuotationListRead(BaseModel):
    id: int
    quote_number: str
    customer_name: str | None = None
    sales_person: str | None = None
    amount: float = 0
    quote_date: str | None = None
    valid_until: str | None = None
    status: str = "draft"
    converted_to_invoice: bool = False


class SOSummaryRead(BaseModel):
    total_orders: int = 0
    pending: int = 0
    confirmed: int = 0
    packed: int = 0
    shipped: int = 0
    delivered: int = 0
    cancelled: int = 0
    revenue: float = 0


class SOListRead(BaseModel):
    id: int
    order_number: str
    customer_name: str | None = None
    order_date: str
    delivery_date: str | None = None
    amount: float = 0
    payment_terms: str | None = None
    status: str = "draft"
    sales_person: str | None = None
    warehouse_name: str | None = None
    packed: bool = False
    shipped: bool = False
    invoiced: bool = False


class DispatchSummaryRead(BaseModel):
    ready_to_dispatch: int = 0
    packed: int = 0
    in_transit: int = 0
    delivered: int = 0
    delayed: int = 0


class DispatchListRead(BaseModel):
    id: int
    sales_order_id: int | None = None
    dispatch_number: str
    challan_number: str | None = None
    so_number: str | None = None
    customer_name: str | None = None
    courier: str | None = None
    vehicle_number: str | None = None
    driver_name: str | None = None
    dispatch_date: str | None = None
    eta: str | None = None
    status: str = "packed"
    lr_number: str | None = None
    tracking_url: str | None = None
    packed: bool = False
    shipped: bool = False
    invoiced: bool = False


class DispatchShipmentCreate(BaseModel):
    sales_order_id: int
    courier: str | None = None
    vehicle_number: str | None = None
    driver_name: str | None = None
    lr_number: str | None = None
    eta: date | None = None
    tracking_url: str | None = None
    status: str = "packed"


class DeliveryChallanRead(BaseModel):
    challan_number: str
    dispatch_number: str
    sales_order_id: int
    so_number: str | None = None
    customer_name: str | None = None
    customer_address: str | None = None
    dispatch_date: str | None = None
    courier: str | None = None
    vehicle_number: str | None = None
    driver_name: str | None = None
    lr_number: str | None = None
    status: str = "packed"
    lines: list[dict] = []
    total_amount: float = 0


class InvoiceSummaryRead(BaseModel):
    total_invoices: int = 0
    draft: int = 0
    paid: int = 0
    pending: int = 0
    overdue: int = 0
    revenue: float = 0


class InvoiceListEnrichedRead(BaseModel):
    id: int
    invoice_number: str
    customer_name: str | None = None
    sales_order_number: str | None = None
    amount: float = 0
    gst_amount: float = 0
    due_date: str | None = None
    status: str = "draft"
    amount_paid: float = 0


class SalesHubRead(BaseModel):
    monthly_revenue: float = 0
    total_orders: int = 0
    pending_orders: int = 0
    dispatch_pending: int = 0
    outstanding_payments: float = 0
    new_customers: int = 0
    top_customers: list[dict] = []
    sales_executive_performance: list[dict] = []
    alerts: list[dict] = []
