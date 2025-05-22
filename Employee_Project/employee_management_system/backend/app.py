from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import sqlite3
from datetime import datetime
import os
import uuid

app = Flask(__name__)
CORS(app)

# Configure uploads directory
app.config['UPLOAD_FOLDER'] = './uploads'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}

# Create uploads directory if it doesn't exist
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# Helper function to check allowed file extensions
def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# Serve uploaded files
@app.route('/uploads/<filename>')
def uploaded_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

# Database initialization
def init_db():
    conn = sqlite3.connect('employee_management.db')
    c = conn.cursor()
    
    # Create employees table
    c.execute('''
        CREATE TABLE IF NOT EXISTS employees (
            employee_id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            current_role TEXT,
            joining_date TEXT,
            profile_photo TEXT
        )
    ''')
    
    # Create role_allocations table
    c.execute('''
        CREATE TABLE IF NOT EXISTS role_allocations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            employee_id TEXT NOT NULL,
            role_id TEXT NOT NULL,
            allocated_date TEXT NOT NULL,
            reporting_role_id TEXT,
            reporting_person TEXT,
            FOREIGN KEY (employee_id) REFERENCES employees (employee_id)
        )
    ''')
    
    conn.commit()
    conn.close()

# Initialize database on startup
init_db()

# Handle profile image upload separately
@app.route('/api/employees/<employee_id>/profile-image', methods=['POST'])
def upload_profile_image(employee_id):
    try:
        if 'profilePic' not in request.files:
            return jsonify({'error': 'No file part'}), 400
            
        file = request.files['profilePic']
        
        if file.filename == '':
            return jsonify({'error': 'No selected file'}), 400
            
        if file and allowed_file(file.filename):
            # Generate a unique filename to avoid conflicts
            filename = str(uuid.uuid4().hex) + '.' + file.filename.rsplit('.', 1)[1].lower()
            file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            file.save(file_path)
            
            # Update database with the new profile photo
            conn = sqlite3.connect('employee_management.db')
            c = conn.cursor()
            
            c.execute('UPDATE employees SET profile_photo = ? WHERE employee_id = ?', 
                    (filename, employee_id))
            
            if c.rowcount == 0:
                conn.close()
                return jsonify({'error': 'Employee not found'}), 404
                
            conn.commit()
            conn.close()
            
            return jsonify({
                'message': 'Profile image uploaded successfully',
                'profile_photo': filename,
                'profile_photo_url': request.host_url + 'uploads/' + filename
            })
        else:
            return jsonify({'error': 'File type not allowed'}), 400
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/get_employee_name/<employee_id>', methods=['GET'])
def get_employee_name(employee_id):
    try:
        conn = sqlite3.connect('employee_management.db')
        c = conn.cursor()
        c.execute('SELECT name FROM employees WHERE employee_id = ?', (employee_id,))
        result = c.fetchone()
        conn.close()
        
        if result:
            return jsonify({'name': result[0]})
        else:
            return jsonify({'error': 'Employee not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/get_employee_role/<employee_id>', methods=['GET'])
def get_employee_role(employee_id):
    try:
        conn = sqlite3.connect('employee_management.db')
        c = conn.cursor()
        c.execute('SELECT current_role FROM employees WHERE employee_id = ?', (employee_id,))
        result = c.fetchone()
        conn.close()
        
        if result:
            return jsonify({'roleId': result[0]})
        else:
            return jsonify({'error': 'Employee not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/get_employees_by_role/<role_id>', methods=['GET'])
def get_employees_by_role(role_id):
    try:
        conn = sqlite3.connect('employee_management.db')
        c = conn.cursor()
        c.execute('''
            SELECT e.employee_id, e.name, e.current_role, e.joining_date
            FROM employees e
            WHERE e.current_role = ?
        ''', (role_id,))
        employees = c.fetchall()
        conn.close()
        
        return jsonify({
            'employees': [
                {
                    'employeeId': emp[0],
                    'name': emp[1],
                    'roleId': emp[2],
                    'joiningDate': emp[3]
                } for emp in employees
            ]
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/allocate_role', methods=['POST'])
def allocate_role():
    try:
        data = request.json
        required_fields = ['employeeId', 'roleId', 'allocatedDate']
        
        # Validate required fields
        if not all(field in data for field in required_fields):
            return jsonify({'error': 'Missing required fields'}), 400
        
        conn = sqlite3.connect('employee_management.db')
        c = conn.cursor()
        
        # Check if employee exists
        c.execute('SELECT name FROM employees WHERE employee_id = ?', (data['employeeId'],))
        employee = c.fetchone()
        
        if not employee:
            # Create new employee if doesn't exist
            c.execute('''
                INSERT INTO employees (employee_id, name, current_role, joining_date)
                VALUES (?, ?, ?, ?)
            ''', (data['employeeId'], data.get('employeeName', ''), data['roleId'], data['allocatedDate']))
        else:
            # Update existing employee's role
            c.execute('''
                UPDATE employees 
                SET current_role = ?
                WHERE employee_id = ?
            ''', (data['roleId'], data['employeeId']))
        
        # Create role allocation record
        c.execute('''
            INSERT INTO role_allocations 
            (employee_id, role_id, allocated_date, reporting_role_id, reporting_person)
            VALUES (?, ?, ?, ?, ?)
        ''', (
            data['employeeId'],
            data['roleId'],
            data['allocatedDate'],
            data.get('reportingRoleId'),
            data.get('reportingPerson')
        ))
        
        conn.commit()
        conn.close()
        
        return jsonify({'message': 'Role allocated successfully'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/role_allocations', methods=['GET'])
def get_role_allocations():
    try:
        role_id = request.args.get('role_id')
        limit = request.args.get('limit', default=10, type=int)
        
        conn = sqlite3.connect('employee_management.db')
        c = conn.cursor()
        
        query = '''
            SELECT ra.id, ra.employee_id, e.name, ra.role_id, ra.allocated_date, ra.reporting_person
            FROM role_allocations ra
            JOIN employees e ON ra.employee_id = e.employee_id
        '''
        params = []
        
        if role_id:
            query += ' WHERE ra.role_id = ?'
            params.append(role_id)
        
        query += ' ORDER BY ra.allocated_date DESC LIMIT ?'
        params.append(limit)
        
        c.execute(query, params)
        allocations = c.fetchall()
        
        return jsonify({
            'allocations': [
                {
                    'id': alloc[0],
                    'employee_id': alloc[1],
                    'employee_name': alloc[2],
                    'role_id': alloc[3],
                    'allocated_date': alloc[4],
                    'reporting_person': alloc[5]
                } for alloc in allocations
            ]
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/role_allocations_stats', methods=['GET'])
def get_role_allocations_stats():
    try:
        conn = sqlite3.connect('employee_management.db')
        c = conn.cursor()
        
        # Get total allocations
        c.execute('SELECT COUNT(*) FROM role_allocations')
        total = c.fetchone()[0]
        
        # Get recent allocations (last 7 days)
        c.execute('''
            SELECT COUNT(*) FROM role_allocations 
            WHERE date(allocated_date) >= date('now', '-7 days')
        ''')
        recent = c.fetchone()[0]
        
        # Get role distribution
        c.execute('''
            SELECT role_id, COUNT(*) as count
            FROM role_allocations
            GROUP BY role_id
            ORDER BY count DESC
        ''')
        role_distribution = [{'role_id': row[0], 'count': row[1]} for row in c.fetchall()]
        
        conn.close()
        
        return jsonify({
            'total': total,
            'recent': recent,
            'pending': 0,  # You can implement pending allocations logic
            'roleDistribution': role_distribution
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True) 