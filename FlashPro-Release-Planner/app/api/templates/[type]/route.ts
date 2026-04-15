import { NextRequest, NextResponse } from 'next/server'
import { exec } from 'child_process'
import { join } from 'path'
import { promisify } from 'util'
import { existsSync, unlinkSync } from 'fs'

const execAsync = promisify(exec)

const TEMPLATES: Record<string, { filename: string; script: string }> = {
  'story-map': {
    filename: 'story-map-template.xlsx',
    script: `
import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment
import sys

wb = openpyxl.Workbook()
ws = wb.active
ws.title = 'Story Map'

headers = ['Story ID', 'Headline', 'User Persona', 'Goal', 'Action', 'Platform Capability', 'Workflow', 'Story Estimate (weeks)', 'Status', 'Points', 'BA Review Comments']
header_fill = PatternFill(start_color='0257A4', end_color='0257A4', fill_type='solid')
header_font = Font(color='FFFFFF', bold=True)

for i, h in enumerate(headers, 1):
    cell = ws.cell(row=1, column=i, value=h)
    cell.fill = header_fill
    cell.font = header_font
    cell.alignment = Alignment(horizontal='center')

# Sample rows
samples = [
    ['S01', 'As a Seller, I can log in with my credentials', 'Seller', 'Onboarding', 'Login', 'Auth Platform', 'Account Setup', 1, '', 5, ''],
    ['S02', 'As a Seller, I can reset my password', 'Seller', 'Onboarding', 'Login', 'Auth Platform', 'Account Setup', 0.5, '', 2, ''],
    ['O01', 'As an Operator, I can manage seller accounts', 'Operator', 'Administration', 'User Management', 'Admin Platform', 'Account Admin', 2, '', 8, ''],
]
for row_i, row in enumerate(samples, 2):
    for col_i, val in enumerate(row, 1):
        ws.cell(row=row_i, column=col_i, value=val)

for col in ws.columns:
    max_len = max(len(str(cell.value or '')) for cell in col)
    ws.column_dimensions[col[0].column_letter].width = min(max_len + 4, 40)

wb.save(sys.argv[1])
print('ok')
`
  },
  'dependency-map': {
    filename: 'dependency-map-template.xlsx',
    script: `
import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment
import sys

wb = openpyxl.Workbook()
ws = wb.active
ws.title = 'Dependencies'

headers = ['Story ID', 'Depends On (Story ID)', 'Type', 'Notes']
header_fill = PatternFill(start_color='7c3aed', end_color='7c3aed', fill_type='solid')
header_font = Font(color='FFFFFF', bold=True)

for i, h in enumerate(headers, 1):
    cell = ws.cell(row=1, column=i, value=h)
    cell.fill = header_fill
    cell.font = header_font
    cell.alignment = Alignment(horizontal='center')

# Type legend
ws2 = wb.create_sheet('Legend')
ws2['A1'] = 'Type'
ws2['B1'] = 'Meaning'
legend = [('H', 'Hard Blocker — Story B cannot start without Story A'), ('C', 'Config Prerequisite — Story B will fail without data from A'), ('D', 'Downstream Consumer — Story B reads output from A')]
for i, (t, m) in enumerate(legend, 2):
    ws2[f'A{i}'] = t
    ws2[f'B{i}'] = m

# Sample rows
samples = [
    ['S02', 'S01', 'H', 'Must log in before resetting password'],
    ['O01', 'S01', 'C', 'Admin needs seller auth to be in place'],
]
for row_i, row in enumerate(samples, 2):
    for col_i, val in enumerate(row, 1):
        ws.cell(row=row_i, column=col_i, value=val)

for col in ws.columns:
    max_len = max(len(str(cell.value or '')) for cell in col)
    ws.column_dimensions[col[0].column_letter].width = min(max_len + 4, 50)

wb.save(sys.argv[1])
print('ok')
`
  },
  'critical-path': {
    filename: 'critical-path-template.xlsx',
    script: `
import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment
import sys

wb = openpyxl.Workbook()
ws = wb.active
ws.title = 'Critical Path'

headers = ['Story ID', 'Is Critical Path', 'Notes']
header_fill = PatternFill(start_color='dc2626', end_color='dc2626', fill_type='solid')
header_font = Font(color='FFFFFF', bold=True)

for i, h in enumerate(headers, 1):
    cell = ws.cell(row=1, column=i, value=h)
    cell.fill = header_fill
    cell.font = header_font
    cell.alignment = Alignment(horizontal='center')

# Sample rows
samples = [
    ['S01', 'Y', 'Core login — blocks all downstream work'],
    ['O01', 'Y', 'Admin setup — needed by operator workflows'],
]
for row_i, row in enumerate(samples, 2):
    for col_i, val in enumerate(row, 1):
        ws.cell(row=row_i, column=col_i, value=val)

for col in ws.columns:
    max_len = max(len(str(cell.value or '')) for cell in col)
    ws.column_dimensions[col[0].column_letter].width = min(max_len + 4, 50)

wb.save(sys.argv[1])
print('ok')
`
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { type: string } }
) {
  const type = params.type
  const template = TEMPLATES[type]

  if (!template) {
    return NextResponse.json({ error: `Unknown template type: ${type}. Valid types: story-map, dependency-map, critical-path` }, { status: 400 })
  }

  const outPath = join(process.cwd(), `_tmp_template_${type}_${Date.now()}.xlsx`)

  try {
    // Write Python script to temp file
    const scriptPath = outPath.replace('.xlsx', '.py')
    const { writeFileSync } = await import('fs')
    writeFileSync(scriptPath, template.script)

    await execAsync(`python3 ${scriptPath} ${outPath}`)

    // Clean up script
    if (existsSync(scriptPath)) unlinkSync(scriptPath)

    if (!existsSync(outPath)) {
      return NextResponse.json({ error: 'Failed to generate template' }, { status: 500 })
    }

    const { readFileSync } = await import('fs')
    const fileBuffer = readFileSync(outPath)
    unlinkSync(outPath)

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${template.filename}"`,
      }
    })
  } catch (err: any) {
    // Clean up on error
    if (existsSync(outPath)) unlinkSync(outPath)
    return NextResponse.json({ error: String(err.message || err) }, { status: 500 })
  }
}
