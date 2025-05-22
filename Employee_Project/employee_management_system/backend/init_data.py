import sqlite3
from datetime import datetime, timedelta

def init_test_data():
    conn = sqlite3.connect('employee_management.db')
    c = conn.cursor()
    
    # Clear existing data
    c.execute('DELETE FROM role_allocations')
    c.execute('DELETE FROM employees')
    
    # Add test employees
    test_employees = [
        ('EMP001', 'John Doe', 'CEO', '2023-01-01'),
        ('EMP002', 'Jane Smith', 'CTO', '2023-01-15'),
        ('EMP003', 'Bob Johnson', 'VP', '2023-02-01'),
        ('EMP004', 'Alice Brown', 'AVP', '2023-02-15'),
        ('EMP005', 'Charlie Wilson', 'SSA', '2023-03-01'),
        ('EMP006', 'Diana Miller', 'SA', '2023-03-15'),
        ('EMP007', 'Edward Davis', 'SSE', '2023-04-01'),
        ('EMP008', 'Fiona Clark', 'SE', '2023-04-15'),
        ('EMP009', 'George White', 'TRN', '2023-05-01'),
        ('EMP010', 'Hannah Lee', 'INTRN', '2023-05-15')
    ]
    
    c.executemany('''
        INSERT INTO employees (employee_id, name, current_role, joining_date)
        VALUES (?, ?, ?, ?)
    ''', test_employees)
    
    # Add test role allocations
    today = datetime.now()
    test_allocations = []
    
    for i, (emp_id, name, role, join_date) in enumerate(test_employees):
        # Create role allocation history
        allocation_date = datetime.strptime(join_date, '%Y-%m-%d')
        test_allocations.append((
            emp_id,
            role,
            allocation_date.strftime('%Y-%m-%d'),
            None if role == 'CEO' else 'EMP001',  # CEO reports to no one
            None if role == 'CEO' else 'John Doe, CEO'
        ))
        
        # Add some historical role changes
        if role != 'CEO' and role != 'CTO':
            prev_role = 'SE' if role == 'SSE' else 'TRN' if role == 'SE' else 'INTRN'
            prev_date = (allocation_date - timedelta(days=30)).strftime('%Y-%m-%d')
            test_allocations.append((
                emp_id,
                prev_role,
                prev_date,
                'EMP001',
                'John Doe, CEO'
            ))
    
    c.executemany('''
        INSERT INTO role_allocations 
        (employee_id, role_id, allocated_date, reporting_role_id, reporting_person)
        VALUES (?, ?, ?, ?, ?)
    ''', test_allocations)
    
    conn.commit()
    conn.close()
    
    print("Test data initialized successfully!")

if __name__ == '__main__':
    init_test_data() 