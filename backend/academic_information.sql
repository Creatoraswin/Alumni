CREATE TABLE IF NOT EXISTS academic_information (
    id INT AUTO_INCREMENT PRIMARY KEY,
    school VARCHAR(255) NOT NULL,
    department VARCHAR(255) NOT NULL,
    programme VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert initial data based on existing hardcoded lists
INSERT INTO academic_information (school, department, programme) VALUES
('SoET', 'CSE', 'B.Tech'),
('SoET', 'ECE', 'B.Tech'),
('SoET', 'Mechanical', 'B.Tech'),
('SoET', 'CSE', 'M.Tech'),
('SoPAHS', 'Radiology', 'B.Sc'),
('SoPAHS', 'Optometry', 'B.Sc'),
('SoPAHS', 'Forensic', 'B.Sc'),
('SoM', 'BBA', 'BBA'),
('SoM', 'BBA', 'MBA');
