-- Clear wrong userType on staff
UPDATE user
SET userType = NULL
WHERE role IN ('ADMIN','SUPER_ADMIN','COMPLIANCE_OFFICER');

-- Default missing clients to INVESTOR
UPDATE user
SET userType = 'INVESTOR'
WHERE role IS NULL
  AND userType IS NULL;
