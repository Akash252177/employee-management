#!/usr/bin/env python3

def fix_indentation():
    with open('Backend/app.py', 'r') as f:
        content = f.read()
    
    # Function 1: Fix export_employee_profile issues around line 5133
    content = content.replace(
        '        # Get employee data\n            try:',
        '        # Get employee data\n        try:'
    )
    
    # Function 2: Fix get_employee_assignments issues for role_allocations around line 5440
    content = content.replace(
        '            """, (employee_id,))\n            \n        role_allocations = cursor.fetchall()',
        '            """, (employee_id,))\n            \n            role_allocations = cursor.fetchall()'
    )
    
    # Fix get_employee_assignments issues for task_allocations around line 5476
    content = content.replace(
        '            """, (employee_id,))\n            \n        task_allocations = cursor.fetchall()',
        '            """, (employee_id,))\n            \n            task_allocations = cursor.fetchall()'
    )
    
    # Fix exception handling in the role_allocations section
    content = content.replace(
        '            response["role_allocations"] = role_allocations\n        except Exception as e:',
        '            response["role_allocations"] = role_allocations\n        except Exception as e:'
    )
    
    # Fix exception handling in the task_allocations section
    content = content.replace(
        '            response["active_tasks_count"] = len([t for t in task_allocations if t.get(\'task_status\', \'\').lower() not in (\'completed\', \'cancelled\')])\n        except Exception as e:',
        '            response["active_tasks_count"] = len([t for t in task_allocations if t.get(\'task_status\', \'\').lower() not in (\'completed\', \'cancelled\')])\n        except Exception as e:'
    )
    
    with open('Backend/app.py', 'w') as f:
        f.write(content)
    
    print("Indentation fixed successfully")

if __name__ == "__main__":
    fix_indentation() 