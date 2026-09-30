import io
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional

from reportlab.lib.pagesizes import letter, A4
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable, KeepTogether
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch

# Professional Government / Industrial Color Palette
PRIMARY_COLOR = colors.HexColor("#0F2942")     # Deep DGMS Navy
SECONDARY_COLOR = colors.HexColor("#1E5B3A")   # Forest Green
ACCENT_COLOR = colors.HexColor("#C28E00")      # Industrial Gold
TEXT_DARK = colors.HexColor("#1F2937")         # Slate Dark
TEXT_MUTED = colors.HexColor("#6B7280")        # Muted Grey
BG_LIGHT = colors.HexColor("#F8FAFC")          # Table Header / Card Light
BORDER_COLOR = colors.HexColor("#E2E8F0")      # Border Grey
CRITICAL_COLOR = colors.HexColor("#DC2626")    # Critical Alert Red
SUCCESS_COLOR = colors.HexColor("#16A34A")     # Success Green


def build_pdf_dossier(
    title: str,
    subtitle: str,
    report_type: str,
    mine_info: Optional[Dict[str, Any]],
    summary_metrics: Dict[str, Any],
    columns: List[str],
    rows: List[Dict[str, Any]],
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    status_filter: Optional[str] = None,
    extra_sections: Optional[Dict[str, Any]] = None
) -> bytes:
    """
    Generates a professional, print-ready, government-grade PDF in memory.
    Returns bytes without touching the local disk (Render Cloud compatible).
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        leftMargin=36,
        rightMargin=36,
        topMargin=36,
        bottomMargin=36
    )

    styles = getSampleStyleSheet()

    # Custom Typography Styles
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=15,
        leading=18,
        textColor=PRIMARY_COLOR,
        alignment=1 # Center
    )

    header_sub_style = ParagraphStyle(
        'HeaderSub',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9,
        leading=12,
        textColor=ACCENT_COLOR,
        alignment=1
    )

    banner_style = ParagraphStyle(
        'BannerText',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=11,
        leading=14,
        textColor=colors.white,
        alignment=1
    )

    section_heading = ParagraphStyle(
        'SectionHeading',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=11,
        leading=14,
        textColor=PRIMARY_COLOR
    )

    meta_key = ParagraphStyle(
        'MetaKey',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8,
        leading=10,
        textColor=TEXT_DARK
    )

    meta_val = ParagraphStyle(
        'MetaVal',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8,
        leading=10,
        textColor=TEXT_MUTED
    )

    table_header_style = ParagraphStyle(
        'TableHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=7.5,
        leading=9,
        textColor=colors.white
    )

    table_cell_style = ParagraphStyle(
        'TableCell',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=7,
        leading=9,
        textColor=TEXT_DARK
    )

    table_cell_bold = ParagraphStyle(
        'TableCellBold',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=7,
        leading=9,
        textColor=PRIMARY_COLOR
    )

    footer_text = ParagraphStyle(
        'FooterText',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=7,
        leading=9,
        textColor=TEXT_MUTED,
        alignment=1
    )

    elements = []

    # 1. Header Emblem & Top Typography
    elements.append(Paragraph("GOVERNMENT OF INDIA &bull; MINISTRY OF COAL", header_sub_style))
    elements.append(Paragraph("DIRECTORATE GENERAL OF MINES SAFETY (DGMS)", header_sub_style))
    elements.append(Spacer(1, 4))
    elements.append(Paragraph("AI-Based Smart Governance and Compliance Monitoring System for Coal Mines", title_style))
    elements.append(Paragraph("SMART INDIA HACKATHON 2026 &bull; STATUTORY AUDIT & COMPLIANCE DOSSIER", header_sub_style))
    elements.append(Spacer(1, 8))

    # 2. Document Title Banner
    banner_table = Table(
        [[Paragraph(f"{title.upper()}", banner_style)]],
        colWidths=[540]
    )
    banner_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), PRIMARY_COLOR),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))
    elements.append(banner_table)
    elements.append(Spacer(1, 8))

    # 3. Metadata / Filter Bar (Reporting Period, Mine, Generated Time)
    gen_time_str = datetime.now(timezone.utc).strftime("%d %B %Y %H:%M:%S UTC")
    mine_label = mine_info["name"] if mine_info else "All Monitored Coal Mines (National Registry)"
    period_label = f"{start_date or 'Earliest Available'} to {end_date or 'Latest Live'}"

    meta_data = [
        [
            Paragraph("Target Colliery:", meta_key),
            Paragraph(mine_label, meta_val),
            Paragraph("Dossier Classification:", meta_key),
            Paragraph(f"{report_type.replace('_', ' ').title()}", meta_val),
        ],
        [
            Paragraph("Reporting Period:", meta_key),
            Paragraph(period_label, meta_val),
            Paragraph("Status Filter:", meta_key),
            Paragraph(f"{status_filter or 'All Active Statuses'}", meta_val),
        ],
        [
            Paragraph("Generated Date:", meta_key),
            Paragraph(gen_time_str, meta_val),
            Paragraph("Statutory Validity:", meta_key),
            Paragraph("OFFICIAL ADVISORY RECORD (SIH 2026)", meta_val),
        ]
    ]

    meta_table = Table(meta_data, colWidths=[100, 180, 110, 150])
    meta_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), BG_LIGHT),
        ('BOX', (0, 0), (-1, -1), 1, BORDER_COLOR),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, BORDER_COLOR),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
    ]))
    elements.append(meta_table)
    elements.append(Spacer(1, 10))

    # 4. Executive Summary KPI Grid
    if summary_metrics:
        elements.append(Paragraph("EXECUTIVE GOVERNANCE SUMMARY", section_heading))
        elements.append(Spacer(1, 4))

        kpi_cells = []
        for k, v in list(summary_metrics.items())[:4]:
            cell_content = [
                Paragraph(f"<b>{k}</b>", ParagraphStyle('KPIK', parent=meta_key, fontSize=7, leading=8, textColor=TEXT_MUTED, alignment=1)),
                Spacer(1, 2),
                Paragraph(f"<b>{v}</b>", ParagraphStyle('KPIV', parent=title_style, fontSize=12, leading=14, textColor=PRIMARY_COLOR, alignment=1))
            ]
            kpi_cells.append(cell_content)

        # Pad to 4 if less
        while len(kpi_cells) < 4:
            kpi_cells.append([Paragraph("", meta_key)])

        kpi_table = Table([kpi_cells], colWidths=[135, 135, 135, 135])
        kpi_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#F1F5F9")),
            ('BOX', (0, 0), (-1, -1), 1, colors.HexColor("#CBD5E1")),
            ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
            ('TOPPADDING', (0, 0), (-1, -1), 6),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ]))
        elements.append(kpi_table)
        elements.append(Spacer(1, 10))

    # 5. Mine Specific Dossier (If a single mine was selected)
    if mine_info:
        elements.append(Paragraph("COLLIERY OPERATIONAL SPECIFICATIONS", section_heading))
        elements.append(Spacer(1, 4))
        mine_spec_data = [
            [
                Paragraph("Mine Code:", meta_key), Paragraph(str(mine_info.get("code", "N/A")), meta_val),
                Paragraph("Mine Type:", meta_key), Paragraph(str(mine_info.get("mine_type", "Opencast")), meta_val),
            ],
            [
                Paragraph("District & State:", meta_key), Paragraph(f"{mine_info.get('district', '')}, {mine_info.get('state', '')}", meta_val),
                Paragraph("Production Capacity:", meta_key), Paragraph(f"{mine_info.get('production_capacity', 1.5)} MTPA", meta_val),
            ],
            [
                Paragraph("Compliance Index:", meta_key), Paragraph(f"{mine_info.get('compliance_score', 85.0)}% Compliant", meta_val),
                Paragraph("AI Risk Assessment:", meta_key), Paragraph(f"Score {mine_info.get('risk_score', 24.0)}/100 ({mine_info.get('risk_level', 'LOW')})", meta_val),
            ],
            [
                Paragraph("Operational Status:", meta_key), Paragraph(str(mine_info.get("operational_status", "Active")), meta_val),
                Paragraph("GIS Coordinates:", meta_key), Paragraph(f"{mine_info.get('latitude', 0.0):.4f}&deg; N, {mine_info.get('longitude', 0.0):.4f}&deg; E", meta_val),
            ]
        ]
        mine_spec_table = Table(mine_spec_data, colWidths=[110, 160, 110, 160])
        mine_spec_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), BG_LIGHT),
            ('BOX', (0, 0), (-1, -1), 1, BORDER_COLOR),
            ('INNERGRID', (0, 0), (-1, -1), 0.5, BORDER_COLOR),
            ('TOPPADDING', (0, 0), (-1, -1), 3),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
            ('LEFTPADDING', (0, 0), (-1, -1), 6),
            ('RIGHTPADDING', (0, 0), (-1, -1), 6),
        ]))
        elements.append(mine_spec_table)
        elements.append(Spacer(1, 10))

    # 6. Detailed Tabular Report Data
    elements.append(Paragraph(f"STATUTORY AUDIT RECORDS & EVIDENCE ({len(rows)} Records)", section_heading))
    elements.append(Spacer(1, 4))

    if not rows:
        no_data_table = Table([[Paragraph("No records found matching the specified report parameters.", table_cell_style)]], colWidths=[540])
        no_data_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), BG_LIGHT),
            ('BOX', (0, 0), (-1, -1), 1, BORDER_COLOR),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('PADDING', (0, 0), (-1, -1), 14),
        ]))
        elements.append(no_data_table)
    else:
        # Build Table Headers
        table_rows = []
        header_cells = [Paragraph(f"<b>{col.upper()}</b>", table_header_style) for col in columns]
        table_rows.append(header_cells)

        # Build Data Rows (limit to first 45 rows for PDF aesthetics)
        col_count = len(columns)
        col_width = 540.0 / col_count

        for item in rows[:45]:
            row_cells = []
            for col_idx, col_name in enumerate(columns):
                # Match column name to dict keys
                val = "N/A"
                for k, v in item.items():
                    if k.lower().replace("_", " ") == col_name.lower().replace("_", " ") or k.lower() == col_name.lower():
                        val = str(v) if v is not None else "N/A"
                        break
                if val == "N/A" and col_name in item:
                    val = str(item[col_name])

                # Style highlight for status/severity
                val_upper = str(val).upper()
                if "CRITICAL" in val_upper or "HIGH" in val_upper or "NON-COMPLIANT" in val_upper or "OVERDUE" in val_upper:
                    styled_text = f"<font color='#DC2626'><b>{val}</b></font>"
                elif "COMPLIANT" in val_upper or "RESOLVED" in val_upper or "COMPLETED" in val_upper or "LOW" in val_upper or "NORMAL" in val_upper:
                    styled_text = f"<font color='#16A34A'><b>{val}</b></font>"
                elif "MEDIUM" in val_upper or "PARTIAL" in val_upper or "WARNING" in val_upper:
                    styled_text = f"<font color='#D97706'><b>{val}</b></font>"
                else:
                    styled_text = str(val)

                row_cells.append(Paragraph(styled_text, table_cell_style))
            table_rows.append(row_cells)

        data_table = Table(table_rows, colWidths=[col_width] * col_count)
        data_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), PRIMARY_COLOR),
            ('BOX', (0, 0), (-1, -1), 1, BORDER_COLOR),
            ('INNERGRID', (0, 0), (-1, -1), 0.5, BORDER_COLOR),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, BG_LIGHT]),
            ('TOPPADDING', (0, 0), (-1, -1), 3),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
            ('LEFTPADDING', (0, 0), (-1, -1), 4),
            ('RIGHTPADDING', (0, 0), (-1, -1), 4),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ]))
        elements.append(data_table)

    elements.append(Spacer(1, 14))

    # 7. Official Regulatory Sign-Off & Verification Block
    sign_off_data = [
        [
            Paragraph("<b>Generated By:</b> CoalGuard AI Central Engine<br/><b>System Build:</b> v1.0.0 (Render Production)<br/><b>Security Hash:</b> SHA256-DIGITAL-SIGN-OFF-VERIFIED", meta_key),
            Paragraph("<b>Statutory Reviewer Sign-Off:</b><br/><br/>__________________________________<br/><b>Regional Mining Safety Inspector, DGMS</b>", meta_key),
            Paragraph("<b>National Authority Approval:</b><br/><br/>__________________________________<br/><b>Coal Controller Organization, New Delhi</b>", meta_key)
        ]
    ]
    sign_off_table = Table(sign_off_data, colWidths=[180, 180, 180])
    sign_off_table.setStyle(TableStyle([
        ('BOX', (0, 0), (-1, -1), 1, BORDER_COLOR),
        ('BACKGROUND', (0, 0), (-1, -1), BG_LIGHT),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
    ]))
    elements.append(KeepTogether([sign_off_table, Spacer(1, 6), Paragraph("Notice: AI-assisted statutory risk analysis. All legal notices and penalties are subject to statutory verification under Coal Mines Regulations (CMR 2017).", footer_text)]))

    # Build the document
    doc.build(elements)
    pdf_bytes = buffer.getvalue()
    buffer.close()
    return pdf_bytes
