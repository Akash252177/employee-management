# Employee Management System Backend

This is the backend server for the Employee Management System, built with Flask and SQLite.

## Setup

1. Create a virtual environment:
```bash
python -m venv venv
```

2. Activate the virtual environment:
- On Windows:
```bash
venv\Scripts\activate
```
- On macOS/Linux:
```bash
source venv/bin/activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

## Running the Server

1. Make sure you're in the backend directory:
```bash
cd employee_management_system/backend
```

2. Run the Flask application:
```bash
python app.py
```

The server will start on http://127.0.0.1:5000

## API Endpoints

- `GET /get_employee_name/<employee_id>` - Get employee name by ID
- `GET /get_employee_role/<employee_id>` - Get employee's current role
- `GET /get_employees_by_role/<role_id>` - Get all employees with a specific role
- `POST /allocate_role` - Allocate a role to an employee
- `GET /api/role_allocations` - Get recent role allocations
- `GET /api/role_allocations_stats` - Get role allocation statistics

## Database

The application uses SQLite as its database. The database file `employee_management.db` will be created automatically when you first run the application. 