#!/usr/bin/env python3

def fix_indentation():
    with open('Backend/app.py', 'r') as f:
        lines = f.readlines()
    
    # Fix the indentation in the create_section_table function
    # The indentation is off at line 5316-5324
    
    # The line with variable problems starts at line 5316 and continues to line 5324
    # Zebra stripe pattern code
    if '                        # Zebra stripe pattern for better readability' in lines[5316]:
        lines[5316] = '            # Zebra stripe pattern for better readability\n'
    
    # Fix next line (for loop indentation)
    if '            for i in range(len(data)):' in lines[5317]:
        lines[5317] = '            for i in range(len(data)):\n'
    
    # Fix if statement indentation
    if '                if i % 2 == 1:' in lines[5318]:
        lines[5318] = '                if i % 2 == 1:\n'
    
    # Fix the table_style.add indentation
    if '                    table_style.add' in lines[5319]:
        lines[5319] = '                    table_style.add(\'BACKGROUND\', (0, i), (-1, i), colors.HexColor(\'#f8fafc\'))  # Lighter blue-gray\n'
    
    # Fix the table.setStyle, elements.append, etc.
    if '            table.setStyle(table_style)' in lines[5321]:
        lines[5321] = '            table.setStyle(table_style)\n'
    
    if '            elements.append(table)' in lines[5322]:
        lines[5322] = '            elements.append(table)\n'
    
    if '            elements.append(Spacer(1, 0.1*inch))' in lines[5323]:
        lines[5323] = '            elements.append(Spacer(1, 0.1*inch))\n'
    
    if '            return table' in lines[5324]:
        lines[5324] = '            return table\n'
    
    with open('Backend/app.py', 'w') as f:
        f.writelines(lines)

if __name__ == "__main__":
    fix_indentation()
    print("Fixed undefined variables in app.py") 