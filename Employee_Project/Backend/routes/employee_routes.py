from flask import Blueprint, jsonify
from models.employee_model import fetch_all_employees

employee_bp = Blueprint('employee_bp', __name__)

@employee_bp.route('/api/employees', methods=['GET'])
def get_employees():
    employees = fetch_all_employees()
    return jsonify(employees)
