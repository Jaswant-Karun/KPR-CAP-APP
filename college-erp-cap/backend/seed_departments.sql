INSERT INTO departments (code, name, short_name, is_active, updated_at)
VALUES
  ('CSB', 'Computer Science and Business Systems', 'CSB', TRUE, NOW()),
  ('CSE', 'Computer Science and Engineering', 'CSE', TRUE, NOW()),
  ('AIDS', 'Artificial Intelligence and Data Science', 'AIDS', TRUE, NOW()),
  ('AIML', 'Artificial Intelligence and Machine Learning', 'AIML', TRUE, NOW()),
  ('IT', 'Information Technology', 'IT', TRUE, NOW()),
  ('ECE', 'Electronics and Communication Engineering', 'ECE', TRUE, NOW()),
  ('EEE', 'Electrical and Electronics Engineering', 'EEE', TRUE, NOW()),
  ('CHE', 'Chemical Engineering', 'CHE', TRUE, NOW()),
  ('CE', 'Civil Engineering', 'CE', TRUE, NOW()),
  ('ME', 'Mechanical Engineering', 'ME', TRUE, NOW()),
  ('MECH', 'Mechatronics Engineering', 'MECH', TRUE, NOW()),
  ('BME', 'Biomedical Engineering', 'BME', TRUE, NOW()),
  ('CYS', 'Cybersecurity Engineering', 'CYS', TRUE, NOW())
ON CONFLICT (code)
DO UPDATE SET
  name = EXCLUDED.name,
  short_name = EXCLUDED.short_name,
  is_active = TRUE,
  updated_at = NOW();
