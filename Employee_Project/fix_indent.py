#!/usr/bin/env python3
import re

# Path to the app.py file
app_file = '/Users/kookie/Documents/Employee_Project/Backend/app.py'
output_file = '/Users/kookie/Documents/Employee_Project/Backend/app.py.fixed_indent'

# Pattern to match the start of the function
function_start_pattern = r'@app\.route\(\'/api/export-employee/<employee_id>/<format>\', methods=\[\'GET\'\]\)'
function_name_pattern = r'def export_employee_profile\(employee_id, format\):'

# Function replacement with correct indentation
replacement_function = '''@app.route('/api/export-employee/<employee_id>/<format>', methods=['GET'])
def export_employee_profile(employee_id, format):
    """
    Export employee profile as CSV or PDF
    
    Args:
        employee_id: The employee ID to export
        format: The format to export (csv or pdf)
    
    Returns:
        A CSV or PDF file with the employee's information
    """
    try:
        print(f"Exporting employee profile for ID: {employee_id} in format: {format}")
        
        # Get employee data
        try:
            print(f"Executing simple query: SELECT * FROM employees WHERE employee_id = %s")
            
            conn = get_db_connection()
            cursor = conn.cursor(dictionary=True)
            cursor.execute("SELECT * FROM employees WHERE employee_id = %s", (employee_id,))
            employee_data = cursor.fetchone()
            
            cursor.close()
            conn.close()
            
            if not employee_data:
                return jsonify({"error": f"Employee with ID {employee_id} not found"}), 404
        except Exception as e:
            print(f"Database error: {e}")
            return jsonify({"error": "Failed to fetch employee data from database"}), 500
        
        # Export the employee data based on the requested format
        if format.lower() == 'csv':
            # Create a CSV file
            csv_output = StringIO()
            csv_writer = csv.writer(csv_output)
            
            # Write employee data to CSV
            for key in sorted(employee_data.keys()):
                if key != 'profile_photo':  # Skip binary data
                    field_name = key.replace('_', ' ').title()
                    csv_writer.writerow([field_name, employee_data[key]])
            
            # Create a response
            response = make_response(csv_output.getvalue())
            response.headers['Content-Type'] = 'text/csv'
            response.headers['Content-Disposition'] = f'attachment; filename=employee_{employee_id}.csv'
            
            # Try to log the download but don't fail if this fails
            try:
                log_download('employee', employee_id, 'csv', 1)
            except Exception as log_err:
                logger = logging.getLogger(__name__)
                logger.warning(f"Error logging download: {str(log_err)}")
            
            return response
            
        elif format.lower() == 'pdf':
            # Create a PDF
            buffer = BytesIO()
            doc = SimpleDocTemplate(buffer, pagesize=A4, 
                                  leftMargin=0.5*inch, rightMargin=0.5*inch,
                                  topMargin=0.5*inch, bottomMargin=0.5*inch)
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
            
            # Get employee name - try multiple fields
            if 'name' in employee_data:
                employee_name = employee_data['name']
            elif 'first_name' in employee_data and 'last_name' in employee_data:
                employee_name = f"{employee_data['first_name']} {employee_data['last_name']}"
            else:
                employee_name = f"Employee {employee_id}"
            
            # Add header with company logo (if available)
            image_path = os.path.join(os.path.dirname(__file__), 'static', 'company_logo.png')
            if os.path.exists(image_path):
                logo = Image(image_path, width=1.5*inch, height=0.5*inch)
                elements.append(logo)
                elements.append(Spacer(1, 0.1*inch))
            
            # Add title and employee ID subtitle    
            elements.append(Paragraph(f"Employee Profile: {employee_name}", title_style))
            elements.append(Paragraph(f"ID: {employee_id}", subtitle_style))
            
            # Add a simpler horizontal line as a rectangle
            elements.append(Spacer(1, 10))
            # Create a rectangle using a table instead of Flowable
            t = Table([['']], colWidths=[500], rowHeights=[2])
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
                    return None
                
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
                return table
            
            # Add each section to the PDF
            if employment_info:
                create_section_table(employment_info, "Employment Information")
            
            if personal_info:
                create_section_table(personal_info, "Personal Information")
            
            if contact_info:
                create_section_table(contact_info, "Contact Information")
            
            if other_info:
                create_section_table(other_info, "Additional Information")
            
            # Add a footer with date and page numbers
            elements.append(Spacer(1, 0.5*inch))
            # Use a table instead of Flowable to create a line
            t2 = Table([['']], colWidths=[500], rowHeights=[1])
            t2.setStyle(TableStyle([('BACKGROUND', (0, 0), (0, 0), colors.HexColor('#94a3b8'))]))
            elements.append(t2)
            elements.append(Spacer(1, 5))
            
            footer_text = f"Generated on {datetime.now().strftime('%d %b %Y %H:%M')} • Confidential Employee Information"
            elements.append(Paragraph(footer_text, footer_style))
            
            # Build the PDF
            doc.build(elements)
            buffer.seek(0)
            
            # Create a response
            response = make_response(buffer.getvalue())
            response.headers['Content-Type'] = 'application/pdf'
            response.headers['Content-Disposition'] = f'attachment; filename=employee_{employee_id}.pdf'
            
            # Try to log the download but don't fail if this fails
            try:
                log_download('employee', employee_id, 'pdf', 1)
            except Exception as log_err:
                logger = logging.getLogger(__name__)
                logger.warning(f"Error logging download: {str(log_err)}")
            
            return response
        
        else:
            return jsonify({"error": f"Unsupported format: {format}. Use 'pdf' or 'csv'."}), 400
        
    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Error exporting employee profile: {str(e)}")
        import traceback
        logger.error(traceback.format_exc())
        
        # Return a clean error message
        return jsonify({"error": "Failed to export employee profile. Please try again later."}), 500'''

# Read the entire file content
with open(app_file, 'r') as f:
    content = f.read()

# Find the function and its content
function_start = re.search(function_start_pattern, content)
if not function_start:
    print("Function start not found")
    exit(1)

function_start_pos = function_start.start()

# Find the next route decorator to determine the end of our function
next_route = re.search(r'@app\.route\(', content[function_start_pos + len(function_start_pattern):])
if next_route:
    function_end_pos = function_start_pos + len(function_start_pattern) + next_route.start()
else:
    # If no next route found, use a different approach
    print("No next route found, using alternative approach")
    exit(1)

# Extract the entire function content
function_content = content[function_start_pos:function_end_pos]

# Replace with corrected function
new_content = content[:function_start_pos] + replacement_function + content[function_end_pos:]

# Write the fixed content back to a new file
with open(output_file, 'w') as f:
    f.write(new_content)

print(f"Fixed content written to {output_file}") 