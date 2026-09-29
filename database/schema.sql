-- ====================================================================
-- CoalGuard AI - Database Schema (MySQL 8.0+)
-- AI-Based Smart Governance and Compliance Monitoring System for Coal Mines
-- Smart India Hackathon 2026
-- ====================================================================

CREATE DATABASE IF NOT EXISTS coalguard_ai CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE coalguard_ai;

-- 1. Roles
CREATE TABLE IF NOT EXISTS roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(255) NULL,
    INDEX idx_roles_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. Mines
CREATE TABLE IF NOT EXISTS mines (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL UNIQUE,
    code VARCHAR(50) NOT NULL UNIQUE,
    location VARCHAR(200) NOT NULL,
    district VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    mine_type VARCHAR(50) DEFAULT 'Opencast',
    production_capacity FLOAT DEFAULT 1.5,
    operational_status VARCHAR(50) DEFAULT 'Active',
    compliance_score FLOAT DEFAULT 85.0,
    risk_score FLOAT DEFAULT 24.0,
    risk_level VARCHAR(20) DEFAULT 'LOW',
    last_inspection DATETIME NULL,
    next_inspection DATETIME NULL,
    latitude FLOAT NOT NULL,
    longitude FLOAT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_mines_code (code),
    INDEX idx_mines_risk (risk_level),
    INDEX idx_mines_state (state)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Users
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(120) NOT NULL UNIQUE,
    hashed_password VARCHAR(255) NOT NULL,
    role_id INT NOT NULL,
    mine_id INT NULL,
    designation VARCHAR(100) NULL,
    phone VARCHAR(20) NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE RESTRICT,
    FOREIGN KEY (mine_id) REFERENCES mines(id) ON DELETE SET NULL,
    INDEX idx_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. Mine Locations / Hazard Zones
CREATE TABLE IF NOT EXISTS mine_locations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    mine_id INT NOT NULL,
    zone_name VARCHAR(100) NOT NULL,
    coordinates VARCHAR(100) NULL,
    hazard_level VARCHAR(30) DEFAULT 'Standard',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (mine_id) REFERENCES mines(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. Compliance Rules
CREATE TABLE IF NOT EXISTS compliance_rules (
    id INT AUTO_INCREMENT PRIMARY KEY,
    rule_code VARCHAR(50) NOT NULL UNIQUE,
    rule_name VARCHAR(200) NOT NULL,
    category VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    penalty_points INT DEFAULT 10,
    mandatory BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_rules_cat (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 6. Compliance Records
CREATE TABLE IF NOT EXISTS compliance_records (
    id INT AUTO_INCREMENT PRIMARY KEY,
    mine_id INT NOT NULL,
    rule_id INT NOT NULL,
    status VARCHAR(50) DEFAULT 'COMPLIANT',
    score FLOAT DEFAULT 100.0,
    due_date DATETIME NULL,
    last_verified DATETIME DEFAULT CURRENT_TIMESTAMP,
    evidence VARCHAR(255) NULL,
    remarks TEXT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (mine_id) REFERENCES mines(id) ON DELETE CASCADE,
    FOREIGN KEY (rule_id) REFERENCES compliance_rules(id) ON DELETE CASCADE,
    INDEX idx_comp_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 7. Inspections
CREATE TABLE IF NOT EXISTS inspections (
    id INT AUTO_INCREMENT PRIMARY KEY,
    mine_id INT NOT NULL,
    inspector_id INT NULL,
    inspection_type VARCHAR(50) DEFAULT 'Routine',
    scheduled_date DATETIME NOT NULL,
    completed_date DATETIME NULL,
    status VARCHAR(50) DEFAULT 'SCHEDULED',
    overall_finding TEXT NULL,
    recommendations TEXT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (mine_id) REFERENCES mines(id) ON DELETE CASCADE,
    FOREIGN KEY (inspector_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_insp_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 8. Inspection Findings
CREATE TABLE IF NOT EXISTS inspection_findings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    inspection_id INT NOT NULL,
    checklist_item VARCHAR(255) NOT NULL,
    answer VARCHAR(20) NOT NULL,
    finding_description TEXT NULL,
    severity VARCHAR(20) DEFAULT 'LOW',
    evidence VARCHAR(255) NULL,
    corrective_action_required BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (inspection_id) REFERENCES inspections(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 9. Violations
CREATE TABLE IF NOT EXISTS violations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    violation_code VARCHAR(50) NOT NULL UNIQUE,
    mine_id INT NOT NULL,
    inspection_id INT NULL,
    category VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    severity VARCHAR(20) DEFAULT 'MEDIUM',
    detected_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    detected_by VARCHAR(100) DEFAULT 'AI Surveillance Engine',
    status VARCHAR(50) DEFAULT 'OPEN',
    due_date DATETIME NULL,
    assigned_officer VARCHAR(100) NULL,
    fine_amount FLOAT DEFAULT 0.0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (mine_id) REFERENCES mines(id) ON DELETE CASCADE,
    FOREIGN KEY (inspection_id) REFERENCES inspections(id) ON DELETE SET NULL,
    INDEX idx_viol_status (status),
    INDEX idx_viol_sev (severity)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 10. Corrective Actions
CREATE TABLE IF NOT EXISTS corrective_actions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    action_code VARCHAR(50) NULL UNIQUE,
    violation_id INT NOT NULL,
    mine_id INT NOT NULL,
    description TEXT NOT NULL,
    assigned_person VARCHAR(100) NOT NULL,
    priority VARCHAR(20) DEFAULT 'MEDIUM',
    due_date DATETIME NOT NULL,
    completion_date DATETIME NULL,
    status VARCHAR(50) DEFAULT 'PENDING',
    evidence VARCHAR(255) NULL,
    officer_notes TEXT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (violation_id) REFERENCES violations(id) ON DELETE CASCADE,
    FOREIGN KEY (mine_id) REFERENCES mines(id) ON DELETE CASCADE,
    INDEX idx_ca_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 11. Sensor Readings (Telemetry)
CREATE TABLE IF NOT EXISTS sensor_readings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    mine_id INT NOT NULL,
    zone VARCHAR(100) DEFAULT 'Shaft A - Section 3',
    methane FLOAT NOT NULL,
    co FLOAT NOT NULL,
    dust FLOAT NOT NULL,
    temperature FLOAT NOT NULL,
    humidity FLOAT NOT NULL,
    noise FLOAT NOT NULL,
    air_quality FLOAT NOT NULL,
    water_quality FLOAT NOT NULL,
    is_anomaly BOOLEAN DEFAULT FALSE,
    anomaly_score FLOAT DEFAULT 0.0,
    risk_flag VARCHAR(30) DEFAULT 'NORMAL',
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (mine_id) REFERENCES mines(id) ON DELETE CASCADE,
    INDEX idx_sensor_time (timestamp),
    INDEX idx_sensor_anom (is_anomaly)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 12. Environmental Readings
CREATE TABLE IF NOT EXISTS environmental_readings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    mine_id INT NOT NULL,
    parameter_name VARCHAR(100) NOT NULL,
    value FLOAT NOT NULL,
    unit VARCHAR(20) NOT NULL,
    status VARCHAR(30) DEFAULT 'NORMAL',
    threshold FLOAT NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (mine_id) REFERENCES mines(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 13. Safety Incidents
CREATE TABLE IF NOT EXISTS safety_incidents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    mine_id INT NOT NULL,
    incident_type VARCHAR(100) NOT NULL,
    severity VARCHAR(20) DEFAULT 'LOW',
    description TEXT NOT NULL,
    incident_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) DEFAULT 'INVESTIGATING',
    casualties INT DEFAULT 0,
    injuries INT DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (mine_id) REFERENCES mines(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 14. Alerts
CREATE TABLE IF NOT EXISTS alerts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    mine_id INT NOT NULL,
    alert_type VARCHAR(100) NOT NULL,
    severity VARCHAR(20) DEFAULT 'MEDIUM',
    message TEXT NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(30) DEFAULT 'UNREAD',
    acknowledged_by VARCHAR(100) NULL,
    FOREIGN KEY (mine_id) REFERENCES mines(id) ON DELETE CASCADE,
    INDEX idx_alert_status (status),
    INDEX idx_alert_sev (severity)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 15. Notifications
CREATE TABLE IF NOT EXISTS notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NULL,
    title VARCHAR(150) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    link VARCHAR(255) NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 16. Documents
CREATE TABLE IF NOT EXISTS documents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    entity_type VARCHAR(50) NOT NULL,
    entity_id INT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_type VARCHAR(50) NOT NULL,
    file_size INT DEFAULT 0,
    uploaded_by VARCHAR(100) DEFAULT 'System',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 17. Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NULL,
    user_email VARCHAR(120) NOT NULL,
    action VARCHAR(100) NOT NULL,
    entity VARCHAR(50) NOT NULL,
    entity_id INT NULL,
    details TEXT NULL,
    ip_address VARCHAR(50) DEFAULT '127.0.0.1',
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_audit_time (timestamp),
    INDEX idx_audit_action (action)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
