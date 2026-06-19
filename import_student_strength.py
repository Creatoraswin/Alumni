import pandas as pd
import mysql.connector

def import_data():
    print("Reading Excel file...")
    # Read the specific sheet
    df = pd.read_excel('Alumni_Data.xlsx', sheet_name='students_strength')
    
    # Fill NaN with empty string
    df = df.fillna('')
    
    # Connect to database
    conn = mysql.connector.connect(
        host="localhost",
        user="root",
        password="",
        database="alumni"
    )
    cursor = conn.cursor()
    
    print("Truncating table student_strength...")
    cursor.execute("TRUNCATE TABLE student_strength")
    
    insert_query = """
    INSERT IGNORE INTO student_strength (registration_no, name, batch, school, branch, program, passout_year)
    VALUES (%s, %s, %s, %s, %s, %s, %s)
    """
    
    # Columns in sheet: Sl.No, Registration No., Name of the Student, Batch, School, Branch, Program, passout
    
    records_to_insert = []
    
    for index, row in df.iterrows():
        reg_no = str(row.get('Registration No.', '')).strip()
        name = str(row.get('Name of the Student', '')).strip()
        batch = str(row.get('Batch', '')).strip()
        school = str(row.get('School', '')).strip()
        branch = str(row.get('Branch', '')).strip()
        program = str(row.get('Program', '')).strip()
        passout = str(row.get('passout', '')).strip()
        
        # passout could be a float initially like 2024.0, convert to int if possible
        if passout and passout.replace('.','',1).isdigit():
            passout = int(float(passout))
        else:
            passout = None
            
        if reg_no and name:
            records_to_insert.append((reg_no, name, batch, school, branch, program, passout))
            
    print(f"Preparing to insert {len(records_to_insert)} records...")
    
    # Insert in chunks
    chunk_size = 1000
    inserted = 0
    for i in range(0, len(records_to_insert), chunk_size):
        chunk = records_to_insert[i:i + chunk_size]
        cursor.executemany(insert_query, chunk)
        conn.commit()
        inserted += len(chunk)
        print(f"Inserted {inserted}/{len(records_to_insert)}")
        
    print("Done!")
    cursor.close()
    conn.close()

if __name__ == "__main__":
    import_data()
