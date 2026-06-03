import os
from datetime import datetime
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet

def generate_invoice(payment_data: dict, user_data: dict, plan_data: dict, output_path: str) -> str:
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    doc = SimpleDocTemplate(output_path, pagesize=A4)
    styles = getSampleStyleSheet()
    elements = []

    elements.append(Paragraph('SUBSPACE PLATFORM', styles['Title']))
    elements.append(Paragraph('Invoice', styles['Heading2']))
    elements.append(Spacer(1, 12))

    invoice_data = [
        ['Invoice #', str(payment_data.get('_id', 'N/A'))],
        ['Date', datetime.now().strftime('%Y-%m-%d')],
        ['Customer', user_data.get('name', 'N/A')],
        ['Email', user_data.get('email', 'N/A')],
        ['Plan', plan_data.get('name', 'N/A')],
        ['Amount', f"₹{payment_data.get('amount', 0) / 100:.2f}"],
        ['Status', payment_data.get('status', 'N/A').upper()],
    ]

    table = Table(invoice_data, colWidths=[150, 300])
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), colors.lightgrey),
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ('PADDING', (0, 0), (-1, -1), 6),
    ]))
    elements.append(table)
    elements.append(Spacer(1, 24))
    elements.append(Paragraph('Thank you for using Subspace Platform!', styles['Normal']))

    doc.build(elements)
    return output_path
