import sqlite3
from io import BytesIO, StringIO
from datetime import datetime
from flask import make_response, jsonify
import csv
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch

# Create a custom line flowable
class CustomLine(object):
    def __init__(self, width, thickness=1, color=colors.black, spaceBefore=0, spaceAfter=0):
        self.width = width
        self.thickness = thickness
        self.color = color
        self.spaceBefore = spaceBefore
        self.spaceAfter = spaceAfter
        
    def wrap(self, availWidth, availHeight):
        self.availWidth = availWidth
        return (self.width, self.thickness + self.spaceBefore + self.spaceAfter)
        
    def draw(self):
        # Draw the line as a rectangle
        canv = self.canv
        canv.saveState()
        canv.setFillColor(self.color)
        canv.rect(0, self.spaceBefore, self.availWidth, self.thickness, fill=1, stroke=0)
        canv.restoreState()

def get_employee_data(employee_id):
    """Get employee data from the database"""
    # Connect to the database
    try:
        conn = sqlite3.connect('employee_db.sqlite')
        cursor = conn.cursor()
        
        # Query employee data
        cursor.execute("SELECT * FROM employees WHERE employee_id = ?", (employee_id,))
        employee = cursor.fetchone()
        
        if not employee:
            return None
            
        # Get column names
        column_names = [description[0] for description in cursor.description]
        
        # Convert to dict
        employee_data = dict(zip(column_names, employee))
        
        # Format dates
        for key, value in employee_data.items():
            if isinstance(value, str) and value.startswith('20') and len(value) == 10 and '-' in value:
                try:
                    date_obj = datetime.strptime(value, '%Y-%m-%d')
                    employee_data[key] = date_obj.strftime('%d %b %Y')
                except:
                    pass
            elif value is None:
                employee_data[key] = ""
                
        cursor.close()
        conn.close()
        
        return employee_data
        
    except Exception as e:
        print(f"Database error: {e}")
        return None

def generate_employee_pdf(employee_id):
    """Generate a PDF for employee data"""
    employee_data = get_employee_data(employee_id)
    
    if not employee_data:
        return None
        
    # Create PDF
    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer, 
        pagesize=A4,
        leftMargin=0.5*inch, 
        rightMargin=0.5*inch,
        topMargin=0.5*inch, 
        bottomMargin=0.5*inch
    )
    
    # Create styles
    styles = getSampleStyleSheet()
    elements = []
    
    # Define custom styles
    title_style = ParagraphStyle(
        'Title',
        parent=styles['Heading1'],
        alignment=1,  # Centered
        spaceAfter=10,
        textColor=colors.HexColor('#1e3a8a'),  # Dark blue
        fontSize=20,
        fontName='Helvetica-Bold',
        leading=24  # Line height
    )
    
    subtitle_style = ParagraphStyle(
        'Subtitle',
        parent=styles['Heading2'],
        alignment=1,  # Centered
        spaceBefore=0,
        spaceAfter=20,
        textColor=colors.HexColor('#475569'),  # Slate gray
        fontSize=12,
        fontName='Helvetica-Oblique'
    )
    
    section_style = ParagraphStyle(
        'Section',
        parent=styles['Heading3'],
        textColor=colors.HexColor('#1e3a8a'),
        fontSize=14,
        fontName='Helvetica-Bold',
        spaceBefore=15,
        spaceAfter=10,
        leftIndent=5
    )
    
    footer_style = ParagraphStyle(
        'Footer',
        parent=styles['Normal'],
        alignment=1,  # Centered
        textColor=colors.HexColor('#64748b'),  # Light slate
        fontSize=8,
        fontName='Helvetica-Oblique'
    )
    
    # Get employee name
    if 'name' in employee_data:
        employee_name = employee_data['name']
    elif 'first_name' in employee_data and 'last_name' in employee_data:
        employee_name = f"{employee_data['first_name']} {employee_data['last_name']}"
    else:
        employee_name = f"Employee {employee_id}"
    
    # Add title and employee ID subtitle
    elements.append(Paragraph(f"Employee Profile: {employee_name}", title_style))
    elements.append(Paragraph(f"ID: {employee_id}", subtitle_style))
    
    # Add space and a line (as a table)
    elements.append(Spacer(1, 10))
    t = Table([['']], colWidths=[6.5*inch], rowHeights=[2])
    t.setStyle(TableStyle([('BACKGROUND', (0, 0), (0, 0), colors.HexColor('#1e3a8a'))]))
    elements.append(t)
    elements.append(Spacer(1, 15))
    
    # Organize data into sections
    personal_info = []
    contact_info = []
    employment_info = []
    other_info = []
    
    # Fields for each section
    personal_fields = ['first_name', 'last_name', 'dob', 'gender', 'nationality', 
                     'marital_status', 'father_name', 'mother_name', 'spouse_name']
    
    contact_fields = ['email', 'mobile', 'alt_mobile', 'alternate_mobile', 'emergency_mobile', 
                     'permanent_address', 'communication_address', 'address']
    
    employment_fields = ['employee_id', 'role_name', 'roleName', 'department', 
                         'doj', 'joining_date', 'joining_location', 'qualification']
    
    # Sort data into sections
    for key, value in employee_data.items():
        key_lower = key.lower()
        if key != 'profile_photo' and value:  # Skip empty fields and binary data
            field_name = key.replace('_', ' ').title()
            value_str = str(value)
            
            if any(field in key_lower for field in personal_fields):
                personal_info.append([field_name, value_str])
            elif any(field in key_lower for field in contact_fields):
                contact_info.append([field_name, value_str])
            elif any(field in key_lower for field in employment_fields):
                employment_info.append([field_name, value_str])
            else:
                other_info.append([field_name, value_str])
    
    # Function to create and style a table for a section
    def create_section_table(data, title):
        if not data:
            return
        
        elements.append(Paragraph(title, section_style))
        
        # Sort data alphabetically by field name
        data.sort(key=lambda x: x[0])
        
        # Create the table
        table = Table(data, colWidths=[2*inch, 4*inch])
        
        # Define table style
        table_style = TableStyle([
            ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#f1f5f9')),  # Light blue-gray
            ('TEXTCOLOR', (0, 0), (0, -1), colors.HexColor('#334155')),  # Dark slate
            ('ALIGN', (0, 0), (0, -1), 'LEFT'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('FONT', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONT', (1, 0), (1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 7),
            ('TOPPADDING', (0, 0), (-1, -1), 7),
            ('LEFTPADDING', (0, 0), (-1, -1), 10),
            ('RIGHTPADDING', (0, 0), (-1, -1), 10),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#cbd5e1')),  # Light gray for grid
            ('BOX', (0, 0), (-1, -1), 1, colors.HexColor('#94a3b8')),  # Slate border
        ])
        
        # Zebra stripe pattern for better readability
        for i in range(len(data)):
            if i % 2 == 1:
                table_style.add('BACKGROUND', (0, i), (-1, i), colors.HexColor('#f8fafc'))  # Lighter blue-gray
        
        table.setStyle(table_style)
        elements.append(table)
        elements.append(Spacer(1, 0.1*inch))
    
    # Add each section to the PDF
    if employment_info:
        create_section_table(employment_info, "Employment Information")
    
    if personal_info:
        create_section_table(personal_info, "Personal Information")
    
    if contact_info:
        create_section_table(contact_info, "Contact Information")
    
    if other_info:
        create_section_table(other_info, "Additional Information")
    
    # Add footer
    elements.append(Spacer(1, 0.5*inch))
    
    # Add a horizontal line as a table
    t2 = Table([['']], colWidths=[6.5*inch], rowHeights=[1])
    t2.setStyle(TableStyle([('BACKGROUND', (0, 0), (0, 0), colors.HexColor('#94a3b8'))]))
    elements.append(t2)
    
    elements.append(Spacer(1, 5))
    footer_text = f"Generated on {datetime.now().strftime('%d %b %Y %H:%M')} • Confidential Employee Information"
    elements.append(Paragraph(footer_text, footer_style))
    
    # Build the PDF
    doc.build(elements)
    buffer.seek(0)
    
    return buffer.getvalue()

# Example usage:
if __name__ == "__main__":
    employee_id = "EMP606"
    pdf_data = generate_employee_pdf(employee_id)
    
    if pdf_data:
        # Save to file for testing
        with open(f"employee_{employee_id}.pdf", "wb") as f:
            f.write(pdf_data)
        print(f"PDF generated for employee {employee_id}")
    else:
        print(f"Failed to generate PDF for employee {employee_id}") 