#!/usr/bin/env python3

def fix_specific_lines():
    with open('Backend/app.py', 'r') as f:
        lines = f.readlines()
    
    # Line-by-line replacements with precise indentation fixes
    # Use explicit line numbers and content
    
    # Fix line 5132 (try statement)
    lines[5132] = '        try:\n'
    
    # Fix line 5145 (except statement)
    lines[5145] = '        except Exception as e:\n'
    
    # Fix line 5439 (role_allocations)
    lines[5439] = '            role_allocations = cursor.fetchall()\n'
    
    # Fix line 5449 (except statement)
    lines[5449] = '        except Exception as e:\n'
    
    # Fix line 5453 (try statement)
    lines[5453] = '        try:\n'
    
    # Fix line 5475 (task_allocations)
    lines[5475] = '            task_allocations = cursor.fetchall()\n'
    
    # Fix line 5485 (except statement)
    lines[5485] = '        except Exception as e:\n'
    
    with open('Backend/app.py', 'w') as f:
        f.writelines(lines)
    
    print("Precise line fixes applied")

if __name__ == "__main__":
    fix_specific_lines() 