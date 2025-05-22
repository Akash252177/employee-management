#!/usr/bin/env python3
# fix_tables.py - Script to safely reset tables with foreign key constraints

import mysql.connector
import sys
import getpass
from mysql.connector import Error

def get_db_connection():
    """Create a connection to the MySQL database"""
    try:
        # Get password securely
        password = getpass.getpass("Enter MySQL password: ")
        
        connection = mysql.connector.connect(
            host="localhost",
            user="root",
            password=password,
            database="employee_management_v2"
        )
        
        if connection.is_connected():
            print("Connected to MySQL database")
            return connection
            
    except Error as e:
        print(f"Error connecting to MySQL database: {e}")
        return None

def reset_projects_table(connection):
    """Reset the projects table by handling foreign key constraints"""
    if not connection:
        return False
    
    cursor = connection.cursor()
    
    try:
        # 1. Check if there are any tasks
        cursor.execute("SELECT COUNT(*) FROM tasks")
        task_count = cursor.fetchone()[0]
        print(f"Found {task_count} tasks in the database")
        
        # 2. Drop foreign key constraint from tasks table
        print("Dropping foreign key constraint from tasks table...")
        cursor.execute("ALTER TABLE `tasks` DROP FOREIGN KEY `tasks_ibfk_1`")
        
        # 3. Truncate the tasks table
        print("Truncating tasks table...")
        cursor.execute("TRUNCATE TABLE `tasks`")
        
        # 4. Truncate the projects table
        print("Truncating projects table...")
        cursor.execute("TRUNCATE TABLE `projects`")
        
        # 5. Recreate foreign key constraint
        print("Recreating foreign key constraint...")
        cursor.execute("""
            ALTER TABLE `tasks` 
            ADD CONSTRAINT `tasks_ibfk_1` 
            FOREIGN KEY (`project_id`) 
            REFERENCES `projects` (`project_id`)
        """)
        
        # Commit the changes
        connection.commit()
        print("Successfully reset projects and tasks tables")
        return True
        
    except Error as e:
        connection.rollback()
        print(f"Error resetting tables: {e}")
        return False
    finally:
        cursor.close()

def main():
    """Main function to handle script execution"""
    print("This script will reset the projects and tasks tables")
    confirmation = input("Are you sure you want to continue? (y/n): ")
    
    if confirmation.lower() != 'y':
        print("Operation cancelled")
        sys.exit(0)
    
    # Connect to the database
    connection = get_db_connection()
    if not connection:
        sys.exit(1)
        
    try:
        # Reset projects table
        success = reset_projects_table(connection)
        if success:
            print("Tables have been reset successfully")
        else:
            print("Failed to reset tables")
            sys.exit(1)
        
    finally:
        if connection and connection.is_connected():
            connection.close()
            print("Database connection closed")

if __name__ == "__main__":
    main() 