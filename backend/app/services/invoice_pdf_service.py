"""Generate A4 portrait GST tax invoice PDF (ReportLab)."""

from __future__ import annotations

import io
from typing import Any

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

from app.services.invoice_gst_service import _money


def _inr(n: float) -> str:
    return f"₹ {_money(n):,.2f}"


def _words_placeholder(grand: float) -> str:
    try:
        from app.utils.inr_words import number_to_words_inr  # optional util

        return number_to_words_inr(grand)
    except Exception:
        return f"Indian Rupees {_money(grand):,.2f} Only"


def generate_invoice_pdf(doc: dict[str, Any]) -> bytes:
    buffer = io.BytesIO()
    pdf = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        leftMargin=12 * mm,
        rightMargin=12 * mm,
        topMargin=10 * mm,
        bottomMargin=10 * mm,
        title=f"Invoice {doc.get('meta', {}).get('invoice_no', '')}",
    )

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        "InvTitle",
        parent=styles["Heading1"],
        fontSize=14,
        alignment=TA_CENTER,
        spaceAfter=6,
        textColor=colors.HexColor("#0f766e"),
    )
    small = ParagraphStyle("Small", parent=styles["Normal"], fontSize=7, leading=9)
    bold_small = ParagraphStyle("BoldSmall", parent=small, fontName="Helvetica-Bold")

    seller = doc.get("seller") or {}
    meta = doc.get("meta") or {}
    buyer = doc.get("buyer") or {}
    summary = doc.get("summary") or {}
    payment = doc.get("payment") or {}
    tax_mode = doc.get("tax_mode") or "cgst_sgst"
    is_igst = tax_mode == "igst"

    story = [
        Paragraph(doc.get("title") or "TAX INVOICE", title_style),
        Spacer(1, 4),
    ]

    header_data = [
        [
            Paragraph(f"<b>{seller.get('name', '')}</b><br/>{seller.get('address', '')}<br/>"
                      f"GSTIN: {seller.get('gstin', '')} | PAN: {seller.get('pan', '')}<br/>"
                      f"Phone: {seller.get('phone', '')} | Email: {seller.get('email', '')}", small),
            Paragraph(
                f"<b>Invoice No:</b> {meta.get('invoice_no', '')}<br/>"
                f"<b>Date:</b> {meta.get('date', '')}<br/>"
                f"<b>Due Date:</b> {meta.get('due_date', '')}<br/>"
                f"<b>E-Way Bill:</b> {meta.get('eway_bill_no', '') or '—'}<br/>"
                f"<b>Place of Supply:</b> {buyer.get('place_of_supply', '')}",
                small,
            ),
        ]
    ]
    header_table = Table(header_data, colWidths=[95 * mm, 85 * mm])
    header_table.setStyle(
        TableStyle(
            [
                ("BOX", (0, 0), (-1, -1), 0.5, colors.grey),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#f8fafc")),
                ("LEFTPADDING", (0, 0), (-1, -1), 6),
                ("RIGHTPADDING", (0, 0), (-1, -1), 6),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ]
        )
    )
    story.append(header_table)
    story.append(Spacer(1, 6))

    party_data = [
        ["Bill To", "Ship To"],
        [
            Paragraph(
                f"<b>{buyer.get('name', '')}</b><br/>{buyer.get('billing_address', '')}<br/>"
                f"GSTIN: {buyer.get('gstin', '')}<br/>State: {buyer.get('state', '')} ({buyer.get('state_code', '')})<br/>"
                f"Contact: {buyer.get('phone', '')}",
                small,
            ),
            Paragraph(
                f"<b>{buyer.get('name', '')}</b><br/>{buyer.get('shipping_address', '')}<br/>"
                f"GSTIN: {buyer.get('gstin', '')}<br/>State: {buyer.get('state', '')} ({buyer.get('state_code', '')})",
                small,
            ),
        ],
    ]
    party_table = Table(party_data, colWidths=[90 * mm, 90 * mm])
    party_table.setStyle(
        TableStyle(
            [
                ("BOX", (0, 0), (-1, -1), 0.5, colors.grey),
                ("INNERGRID", (0, 0), (-1, -1), 0.25, colors.lightgrey),
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#0f766e")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, 0), 8),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 5),
                ("TOPPADDING", (0, 0), (-1, -1), 4),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
            ]
        )
    )
    story.append(party_table)
    story.append(Spacer(1, 6))

    if is_igst:
        item_header = ["#", "Description", "HSN", "Qty", "Unit", "Rate", "Taxable", "IGST%", "Total"]
        col_widths = [8 * mm, 52 * mm, 18 * mm, 14 * mm, 12 * mm, 18 * mm, 20 * mm, 12 * mm, 20 * mm]
    else:
        item_header = ["#", "Description", "HSN", "Qty", "Unit", "Rate", "Taxable", "CGST%", "SGST%", "Total"]
        col_widths = [8 * mm, 44 * mm, 16 * mm, 12 * mm, 10 * mm, 16 * mm, 18 * mm, 10 * mm, 10 * mm, 18 * mm]

    rows = [item_header]
    for item in doc.get("items") or []:
        if is_igst:
            rows.append(
                [
                    str(item.get("si", "")),
                    str(item.get("description", ""))[:80],
                    item.get("hsn", ""),
                    f"{item.get('qty', 0):.2f}",
                    item.get("unit", ""),
                    f"{item.get('rate', 0):.2f}",
                    f"{item.get('taxable_amount', 0):.2f}",
                    f"{item.get('igst_pct', 0):.1f}",
                    f"{item.get('total_amount', 0):.2f}",
                ]
            )
        else:
            rows.append(
                [
                    str(item.get("si", "")),
                    str(item.get("description", ""))[:70],
                    item.get("hsn", ""),
                    f"{item.get('qty', 0):.2f}",
                    item.get("unit", ""),
                    f"{item.get('rate', 0):.2f}",
                    f"{item.get('taxable_amount', 0):.2f}",
                    f"{item.get('cgst_pct', 0):.1f}",
                    f"{item.get('sgst_pct', 0):.1f}",
                    f"{item.get('total_amount', 0):.2f}",
                ]
            )

    items_table = Table(rows, colWidths=col_widths, repeatRows=1)
    items_table.setStyle(
        TableStyle(
            [
                ("BOX", (0, 0), (-1, -1), 0.5, colors.grey),
                ("INNERGRID", (0, 0), (-1, -1), 0.25, colors.lightgrey),
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#134e4a")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, -1), 7),
                ("ALIGN", (0, 1), (0, -1), "CENTER"),
                ("ALIGN", (3, 1), (-1, -1), "RIGHT"),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("TOPPADDING", (0, 0), (-1, -1), 3),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
            ]
        )
    )
    story.append(items_table)
    story.append(Spacer(1, 6))

    totals = [
        ["Taxable Value", _inr(summary.get("taxable_value", 0))],
    ]
    if is_igst:
        totals.append(["IGST Total", _inr(summary.get("igst_total", 0))])
    else:
        totals.append(["CGST Total", _inr(summary.get("cgst_total", 0))])
        totals.append(["SGST Total", _inr(summary.get("sgst_total", 0))])
    if summary.get("round_off"):
        totals.append(["Round Off", _inr(summary.get("round_off", 0))])
    totals.append(["Grand Total", _inr(summary.get("grand_total", 0))])

    totals_table = Table(totals, colWidths=[120 * mm, 60 * mm])
    totals_table.setStyle(
        TableStyle(
            [
                ("BOX", (0, 0), (-1, -1), 0.5, colors.grey),
                ("ALIGN", (1, 0), (1, -1), "RIGHT"),
                ("FONTNAME", (0, -1), (-1, -1), "Helvetica-Bold"),
                ("BACKGROUND", (0, -1), (-1, -1), colors.HexColor("#ecfdf5")),
                ("FONTSIZE", (0, 0), (-1, -1), 8),
                ("TOPPADDING", (0, 0), (-1, -1), 4),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
                ("LEFTPADDING", (0, 0), (-1, -1), 6),
                ("RIGHTPADDING", (0, 0), (-1, -1), 6),
            ]
        )
    )
    story.append(totals_table)
    story.append(Spacer(1, 4))
    story.append(Paragraph(f"<b>Amount in words:</b> {_words_placeholder(summary.get('grand_total', 0))}", small))
    story.append(Spacer(1, 6))

    bank_lines = (
        f"Bank: {payment.get('bank_name', '')} | A/C: {payment.get('account_number', '')} | "
        f"IFSC: {payment.get('ifsc', '')} | Balance Due: {_inr(payment.get('balance_due', 0))}"
    )
    story.append(Paragraph(bank_lines, small))
    story.append(Spacer(1, 8))

    footer = Table(
        [
            [
                Paragraph(f"Prepared by: {doc.get('prepared_by', '')}", small),
                Paragraph("Checked by: ___________", small),
                Paragraph(f"for {seller.get('name', '')}<br/><br/>Authorised Signatory", small),
            ]
        ],
        colWidths=[60 * mm, 55 * mm, 65 * mm],
    )
    footer.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "TOP")]))
    story.append(footer)
    story.append(Spacer(1, 6))
    story.append(
        Paragraph(
            "<i>This is a Computer Generated Invoice</i>",
            ParagraphStyle("Foot", parent=small, alignment=TA_CENTER, textColor=colors.grey),
        )
    )

    pdf.build(story)
    return buffer.getvalue()
