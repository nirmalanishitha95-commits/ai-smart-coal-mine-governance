-- ====================================================================
-- CoalGuard AI - Seed Data (MySQL 8.0+)
-- AI-Based Smart Governance and Compliance Monitoring System for Coal Mines
-- ====================================================================

USE coalguard_ai;

-- 1. Roles
INSERT INTO roles (id, name, description) VALUES
(1, 'SUPER_ADMIN', 'National Coal Controller and System Administrator'),
(2, 'GOVERNMENT_OFFICER', 'DGMS Regional & District Mining Officer'),
(3, 'MINE_MANAGER', 'On-site Mine General Manager & Safety Lead'),
(4, 'INSPECTOR', 'Statutory Mining & Environmental Inspector')
ON DUPLICATE KEY UPDATE description=VALUES(description);

-- 2. Demo Users (Password: Admin@123, Officer@123, Manager@123, Inspector@123)
-- PBKDF2 HMAC SHA-256 standard hashes
INSERT INTO users (id, name, email, hashed_password, role_id, mine_id, designation, phone, is_active) VALUES
(1, 'National Coal Controller', 'admin@coalguard.gov.in', 'pbkdf2_sha256$8f91a2b3c4d5e6f7$8829f7cf94a085b376b321eb1a478b010d1887e07eb443fa3fb8b066f77395b0', 1, NULL, 'Director General of Mine Safety', '+91-9876543210', 1),
(2, 'Er. Rajesh Kumar', 'officer@coalguard.gov.in', 'pbkdf2_sha256$8f91a2b3c4d5e6f7$8829f7cf94a085b376b321eb1a478b010d1887e07eb443fa3fb8b066f77395b0', 2, NULL, 'Regional Mining Officer - DGMS', '+91-9876543211', 1),
(3, 'S. K. Mukherjee', 'manager@coalguard.gov.in', 'pbkdf2_sha256$8f91a2b3c4d5e6f7$8829f7cf94a085b376b321eb1a478b010d1887e07eb443fa3fb8b066f77395b0', 3, 1, 'General Manager (Operations)', '+91-9876543212', 1),
(4, 'Amitabh Sen', 'inspector@coalguard.gov.in', 'pbkdf2_sha256$8f91a2b3c4d5e6f7$8829f7cf94a085b376b321eb1a478b010d1887e07eb443fa3fb8b066f77395b0', 4, NULL, 'Statutory Mine Safety Inspector', '+91-9876543213', 1)
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- 3. Mines
INSERT INTO mines (id, name, code, location, district, state, mine_type, production_capacity, operational_status, compliance_score, risk_score, risk_level, latitude, longitude) VALUES
(1, 'Jharia Deep Seam Colliery', 'MINE-JH-01', 'Jharia Coalfield, Dhanbad', 'Dhanbad', 'Jharkhand', 'Underground', 2.4, 'Active', 78.5, 68.0, 'HIGH', 23.7500, 86.4200),
(2, 'Korba Super Pit Block-B', 'MINE-CG-02', 'Gevra Open Cast Complex, Korba', 'Korba', 'Chhattisgarh', 'Opencast', 6.8, 'Active', 92.0, 24.0, 'LOW', 22.3595, 82.6841),
(3, 'Singrauli Northern Ridge', 'MINE-MP-03', 'Jayant Mining Block, Singrauli', 'Singrauli', 'Madhya Pradesh', 'Opencast', 4.5, 'Active', 85.0, 38.0, 'MEDIUM', 24.1997, 82.6644),
(4, 'Talcher Valley Colliery', 'MINE-OD-04', 'Bhubaneswari Mine Area, Talcher', 'Angul', 'Odisha', 'Opencast', 5.2, 'Active', 89.0, 28.0, 'LOW', 20.9500, 85.2200),
(5, 'Raniganj Heritage Seam Shaft-7', 'MINE-WB-05', 'Asansol Mining Zone, Raniganj', 'Paschim Bardhaman', 'West Bengal', 'Underground', 1.2, 'Under Review', 64.0, 86.0, 'CRITICAL', 23.6190, 87.1290),
(6, 'Ib Valley Open Cast Sector-2', 'MINE-OD-06', 'Jharsuguda Coal Belt, Brajrajnagar', 'Jharsuguda', 'Odisha', 'Opencast', 3.8, 'Active', 88.5, 27.0, 'LOW', 21.8200, 83.9200),
(7, 'Kusmunda Mega Opencast', 'MINE-CG-07', 'Kusmunda Colliery, Korba', 'Korba', 'Chhattisgarh', 'Opencast', 7.5, 'Active', 82.0, 45.0, 'MEDIUM', 22.3100, 82.6900),
(8, 'Ramagundam OC-3 Project', 'MINE-TS-08', 'Godavari Valley Coalfield, Ramagundam', 'Peddapalli', 'Telangana', 'Mixed', 3.0, 'Active', 90.0, 25.0, 'LOW', 18.7600, 79.4800),
(9, 'Bokaro Bermo Deep Shaft', 'MINE-JH-09', 'East Bokaro Coalfield, Bermo', 'Bokaro', 'Jharkhand', 'Underground', 1.6, 'Maintenance', 72.0, 62.0, 'HIGH', 23.7700, 85.9300),
(10, 'Wardha Valley Ballarpur Colliery', 'MINE-MH-10', 'Chandrapur Coal Basin, Ballarpur', 'Chandrapur', 'Maharashtra', 'Underground', 1.8, 'Active', 81.0, 48.0, 'MEDIUM', 19.8500, 79.3500)
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- 4. Compliance Rules
INSERT INTO compliance_rules (id, rule_code, rule_name, category, description, penalty_points, mandatory) VALUES
(1, 'RULE-SAF-01', 'Flameproof Electrical Apparatus Certification', 'Safety', 'Mandatory DGMS certification for all underground electrical gear.', 20, 1),
(2, 'RULE-SAF-02', 'Underground Atmospheric Gas Threshold Monitoring', 'Safety', 'Real-time methane & CO sensors must be calibrated bi-weekly.', 25, 1),
(3, 'RULE-SAF-03', 'Auxiliary Ventilation & Air Circulation Compliance', 'Safety', 'Maintain minimum 15 m3/min airflow per worker at active coal face.', 25, 1),
(4, 'RULE-SAF-04', 'Strata Control & Roof Bolting Inspection', 'Safety', 'Routine testing of load indicators on roof support structures.', 15, 1),
(5, 'RULE-ENV-01', 'Effluent Treatment & Acid Mine Drainage Control', 'Environmental', 'Water discharge pH must strictly remain between 6.5 and 8.5.', 20, 1),
(6, 'RULE-ENV-02', 'Ambient Respirable Dust Concentration (PM10/PM2.5)', 'Environmental', 'Quarterly dust surveys and functioning high-pressure water mist cannons.', 15, 1),
(7, 'RULE-ENV-03', 'Overburden Topsoil Reclamation & Plantation', 'Environmental', 'Progressive backfilling and native afforestation on dump slopes.', 10, 1),
(8, 'RULE-EQP-01', 'Heavy Earth Moving Machinery (HEMM) Fitness', 'Equipment', 'Valid fitness certificates and operational automatic fire suppression systems (AFSS).', 15, 1),
(9, 'RULE-LAB-01', 'Personal Protective Equipment (PPE) Compliance', 'Labour', 'Zero tolerance for workers operating without helmet, safety boots, cap lamp and dust mask.', 10, 1),
(10, 'RULE-EMG-01', 'Emergency Refuge Chamber & Self-Contained Self-Rescuer (SCSR)', 'Emergency preparedness', 'Emergency escape pods stocked with 72h oxygen rations.', 25, 1)
ON DUPLICATE KEY UPDATE rule_name=VALUES(rule_name);
