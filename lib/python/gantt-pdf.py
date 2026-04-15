"""
FlashPro Release Planner — Gantt Chart PDF Generator
Receives JSON payload via stdin, outputs PDF bytes to stdout.

Input JSON shape:
{
  "title": "MyProject — Gantt Chart",
  "groupByLabel": "Stream",
  "sprints": [{"key":"sprint1","label":"Sprint 1","dateLabel":"Apr 14 – Apr 27","color":"#5B8DEF"}, ...],
  "rows": [
    {
      "key": "s1", "label": "Stream 1", "color": "#5B8DEF",
      "totalPts": 24.5,
      "cells": {
        "sprint1": {"stories": 3, "pts": 8.0, "headline": "Register as...", "over": false},
        "sprint2": {"stories": 1, "pts": 2.0, "headline": "Upload docs",  "over": false}
      }
    }
  ],
  "backlog": {"count": 12, "pts": 18.0}
}
"""

import sys, json, io
from reportlab.lib import colors
from reportlab.lib.pagesizes import A3, landscape
from reportlab.lib.units import mm
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import (
    SimpleDocTemplate, Table, TableStyle, Paragraph,
    Spacer, KeepInFrame
)
from reportlab.platypus.flowables import HRFlowable
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT

def hex_to_color(hex_str: str, alpha: float = 1.0):
    h = hex_str.lstrip('#')
    r, g, b = int(h[0:2],16)/255, int(h[2:4],16)/255, int(h[4:6],16)/255
    return colors.Color(r, g, b, alpha)

def pastel(hex_str: str):
    """Mix colour 72% toward white."""
    h = hex_str.lstrip('#')
    r, g, b = int(h[0:2],16), int(h[2:4],16), int(h[4:6],16)
    mix = lambda c: (c + (255 - c) * 0.72) / 255
    return colors.Color(mix(r), mix(g), mix(b))

def pastel_border(hex_str: str):
    """Mix colour 40% toward white."""
    h = hex_str.lstrip('#')
    r, g, b = int(h[0:2],16), int(h[2:4],16), int(h[4:6],16)
    mix = lambda c: (c + (255 - c) * 0.40) / 255
    return colors.Color(mix(r), mix(g), mix(b))

def pastel_text(hex_str: str):
    """Darken to 55% for text on pastel bg."""
    h = hex_str.lstrip('#')
    r, g, b = int(h[0:2],16)*0.55/255, int(h[2:4],16)*0.55/255, int(h[4:6],16)*0.55/255
    return colors.Color(r, g, b)

NAV_BG   = colors.Color(0.118, 0.118, 0.118)   # #1e3a5f → use dark navy for headers
HDR_BG   = colors.Color(0.118, 0.220, 0.373)   # #1e3a5f
HDR_TEXT = colors.white
BORDER_C = colors.Color(0.894, 0.894, 0.902)   # #E4E4E7
ROW_ALT  = colors.Color(0.980, 0.980, 0.980)   # #FAFAFA
BODY_FONT = 'Helvetica'
BOLD_FONT = 'Helvetica-Bold'

def truncate(s: str, n: int) -> str:
    return s[:n] + '…' if len(s) > n else s

def main():
    payload = json.loads(sys.stdin.read())
    title         = payload.get('title', 'Gantt Chart')
    group_label   = payload.get('groupByLabel', 'Group')
    sprints       = payload.get('sprints', [])
    rows          = payload.get('rows', [])
    backlog       = payload.get('backlog', {})

    buf = io.BytesIO()
    PAGE = landscape(A3)
    M = 15 * mm  # margin

    doc = SimpleDocTemplate(
        buf,
        pagesize=PAGE,
        leftMargin=M, rightMargin=M,
        topMargin=M, bottomMargin=M,
        title=title,
    )

    # ── Column widths ──────────────────────────────────────────────────────
    PAGE_W = PAGE[0]
    USABLE_W = PAGE_W - 2 * M
    LABEL_W  = 44 * mm
    n_sprints = len(sprints)
    COL_W    = (USABLE_W - LABEL_W) / max(n_sprints, 1)

    col_widths = [LABEL_W] + [COL_W] * n_sprints

    # ── Styles ──────────────────────────────────────────────────────────────
    styles = getSampleStyleSheet()

    def cell_para(text, font=BODY_FONT, size=7, color=colors.black,
                  align=TA_LEFT, leading=9):
        style = styles['Normal'].clone('x')
        style.fontName = font
        style.fontSize = size
        style.textColor = color
        style.alignment = align
        style.leading = leading
        style.spaceAfter = 0
        style.spaceBefore = 0
        return Paragraph(text, style)

    # ── Header row ────────────────────────────────────────────────────────
    hdr_cells = [cell_para(group_label, BOLD_FONT, 8, HDR_TEXT)]
    for sp in sprints:
        label_line = f"<b>{sp['label']}</b>"
        date_line  = f"<font size=6 color='#BAC8FF'>{sp.get('dateLabel','')}</font>"
        inner = label_line + ('<br/>' + date_line if sp.get('dateLabel') else '')
        hdr_cells.append(cell_para(inner, BOLD_FONT, 8, HDR_TEXT, TA_CENTER, 11))

    # ── Data rows ────────────────────────────────────────────────────────
    table_data = [hdr_cells]
    row_colors: list = [(HDR_BG, 0, 0, HDR_BG, 0, n_sprints)]  # header bg

    for ri, row in enumerate(rows):
        row_color_c = hex_to_color(row['color'])
        bg_c = ROW_ALT if ri % 2 == 0 else colors.white
        p_bg    = pastel(row['color'])
        p_text  = pastel_text(row['color'])
        p_bdr   = pastel_border(row['color'])

        # Label cell
        pts_str = f" ({row['totalPts']:.1f}pts)" if row.get('totalPts',0) > 0 else ''
        label_content = cell_para(
            f"<font color='#{row['color'].lstrip('#')}'><b>●</b></font>  "
            + truncate(row['label'], 26) + pts_str,
            BODY_FONT, 7, colors.Color(0.094,0.094,0.106)
        )

        row_cells = [label_content]

        for sp in sprints:
            cell = row.get('cells', {}).get(sp['key'], {})
            if cell and cell.get('stories', 0) > 0:
                n = cell['stories']
                pts = cell.get('pts', 0)
                hl  = cell.get('headline', '')
                hl_text = truncate(hl, 20) if n == 1 else f"{n} stories"
                pts_txt = f"{pts:.1f}pts"
                content = cell_para(
                    f"<b>{hl_text}</b><br/><font size=6>{pts_txt}</font>",
                    BODY_FONT, 7, p_text, TA_LEFT, 9
                )
            else:
                content = Paragraph('', styles['Normal'])
            row_cells.append(content)

        table_data.append(row_cells)

        # Row background
        row_idx = ri + 1  # +1 for header
        row_colors.append((bg_c, row_idx, 0, bg_c, row_idx, n_sprints))

        # Cell bar backgrounds for non-empty cells
        for ci, sp in enumerate(sprints):
            cell = row.get('cells', {}).get(sp['key'], {})
            if cell and cell.get('stories', 0) > 0:
                row_colors.append((p_bg, row_idx, ci+1, p_bg, row_idx, ci+1))

    # ── Backlog summary row ───────────────────────────────────────────────
    if backlog.get('count', 0) > 0:
        bl_text = (f"Backlog: {backlog['count']} stories · "
                   f"{backlog.get('pts',0):.1f} pts unplanned")
        backlog_row = [cell_para(bl_text, BODY_FONT, 7, colors.Color(0.631,0.631,0.651),
                                  TA_LEFT)] + [Paragraph('', styles['Normal'])] * n_sprints
        table_data.append(backlog_row)
        bl_idx = len(table_data) - 1
        row_colors.append((ROW_ALT, bl_idx, 0, ROW_ALT, bl_idx, n_sprints))

    # ── Build table style ─────────────────────────────────────────────────
    ts = TableStyle([
        # Grid
        ('GRID',        (0,0), (-1,-1), 0.4, BORDER_C),
        ('LINEBELOW',   (0,0), (-1,0),  0.8, HDR_BG),
        # Header
        ('FONTNAME',    (0,0), (-1,0),  BOLD_FONT),
        ('FONTSIZE',    (0,0), (-1,0),  8),
        ('TEXTCOLOR',   (0,0), (-1,0),  HDR_TEXT),
        ('ALIGN',       (1,0), (-1,0),  'CENTER'),
        ('VALIGN',      (0,0), (-1,-1), 'MIDDLE'),
        # Padding
        ('LEFTPADDING',  (0,0), (-1,-1), 4),
        ('RIGHTPADDING', (0,0), (-1,-1), 4),
        ('TOPPADDING',   (0,0), (-1,-1), 3),
        ('BOTTOMPADDING',(0,0), (-1,-1), 3),
        # Row heights
        ('ROWHEIGHT',    (0,0), (-1,0),  14),
        ('ROWHEIGHT',    (0,1), (-1,-1), 11),
    ])

    # Apply per-row background colours
    for bg, r0, c0, bg2, r1, c1 in row_colors:
        ts.add('BACKGROUND', (c0, r0), (c1, r1), bg)

    table = Table(table_data, colWidths=col_widths, repeatRows=1)
    table.setStyle(ts)

    # ── Build document flowables ──────────────────────────────────────────
    title_style = styles['Normal'].clone('title')
    title_style.fontName = BOLD_FONT
    title_style.fontSize = 13
    title_style.textColor = colors.Color(0.094,0.094,0.106)

    sub_style = styles['Normal'].clone('sub')
    sub_style.fontName = BODY_FONT
    sub_style.fontSize = 8
    sub_style.textColor = colors.Color(0.322,0.322,0.357)

    story = [
        Paragraph(title, title_style),
        Spacer(1, 2*mm),
        Paragraph(f"Grouped by: {group_label}", sub_style),
        Spacer(1, 4*mm),
        table,
    ]

    doc.build(story)
    sys.stdout.buffer.write(buf.getvalue())

if __name__ == '__main__':
    main()
