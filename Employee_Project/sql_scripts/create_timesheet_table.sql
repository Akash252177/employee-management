CREATE TABLE time_sheet_entries (
    -- Primary Key
    entry_id INT AUTO_INCREMENT PRIMARY KEY,
    
    -- Employee Information
    employee_id VARCHAR(50) NOT NULL,
    employee_name VARCHAR(100) NOT NULL,
    
    -- Basic Time Information
    entry_date DATE NOT NULL,
    in_time TIME NOT NULL,
    out_time TIME NOT NULL,
    total_hours DECIMAL(5,2) NOT NULL,
    
    -- Assigned Tasks (JSON format)
    assigned_tasks JSON DEFAULT (JSON_ARRAY()),
    /* Example assigned_tasks structure:
    [
        {
            "task_id": "T595",
            "task_name": "Employee TimeSheet",
            "time_spent": 1.50,
            "remarks": "Completed initial setup"
        },
        {
            "task_id": "T919",
            "task_name": "Database Design",
            "time_spent": 2.25,
            "remarks": "Created table structure"
        }
    ]
    */
    
    -- Miscellaneous Tasks (JSON format)
    misc_tasks JSON DEFAULT (JSON_ARRAY()),
    /* Example misc_tasks structure:
    [
        {
            "task_description": "Team Meeting",
            "time_spent": 1.0,
            "remarks": "Weekly sync-up"
        },
        {
            "task_description": "Documentation",
            "time_spent": 0.75,
            "remarks": "Updated project docs"
        }
    ]
    */
    
    -- Approval Information
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'submitted', 'approved', 'rejected', 'revised')),
    approved_by VARCHAR(50) NULL,
    approval_date DATETIME NULL,
    rejection_reason TEXT NULL,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Indexes for better performance
    INDEX idx_employee_id (employee_id),
    INDEX idx_entry_date (entry_date),
    INDEX idx_status (status)
); 