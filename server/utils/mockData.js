// Seed patients, devices, alerts, and AI predictions
// Used to populate realistic demo data

export const MOCK_PATIENTS = [
  {
    id: 'PD001',
    name: 'Marcus Thompson',
    age: 68,
    diagnosis_stage: 2,
    emergency_contact: '+91-98765-43210',
    avatar_initials: 'MT',
  },
  {
    id: 'PD002',
    name: 'Eleanor Rodriguez',
    age: 72,
    diagnosis_stage: 3,
    emergency_contact: '+91-98765-43211',
    avatar_initials: 'ER',
  },
  {
    id: 'PD003',
    name: 'James Chen',
    age: 65,
    diagnosis_stage: 2,
    emergency_contact: '+91-98765-43212',
    avatar_initials: 'JC',
  },
];

export const MOCK_USERS = [
  {
    name: 'Dr. Priya Sharma',
    email: 'doctor@pdcompanion.com',
    password: 'Doctor@123',
    role: 'doctor',
  },
  {
    name: 'Rahul Thompson',
    email: 'caretaker1@pdcompanion.com',
    password: 'Care@123',
    role: 'caretaker',
  },
  {
    name: 'Marcus Thompson',
    email: 'patient1@pdcompanion.com',
    password: 'Patient@123',
    role: 'patient',
  },
];

export const MOCK_DEVICES = [
  { patient_id: 'PD001', device_type: 'cap',       battery_level: 87, status: 'online',  firmware_version: '2.1.0' },
  { patient_id: 'PD001', device_type: 'wristband',  battery_level: 62, status: 'online',  firmware_version: '2.0.3' },
  { patient_id: 'PD002', device_type: 'cap',        battery_level: 45, status: 'online',  firmware_version: '2.1.0' },
  { patient_id: 'PD002', device_type: 'wristband',  battery_level: 91, status: 'online',  firmware_version: '2.0.3' },
  { patient_id: 'PD003', device_type: 'cap',        battery_level: 23, status: 'charging',firmware_version: '2.1.0' },
  { patient_id: 'PD003', device_type: 'wristband',  battery_level: 78, status: 'online',  firmware_version: '2.0.3' },
];

export const MOCK_ALERTS = [
  { patient_id: 'PD001', type: 'FALL',    severity: 'critical', message: 'Fall detected near bedroom. Immediate assistance required.', resolved: false },
  { patient_id: 'PD002', type: 'TREMOR',  severity: 'high',     message: 'Tremor score exceeded 0.8 for more than 5 minutes.', resolved: false },
  { patient_id: 'PD003', type: 'BATTERY', severity: 'medium',   message: 'Smart Cap battery below 25%. Please charge device.', resolved: false },
  { patient_id: 'PD001', type: 'HR',      severity: 'high',     message: 'Heart rate elevated to 132 bpm. Monitoring closely.', resolved: true },
  { patient_id: 'PD002', type: 'FALL',    severity: 'critical', message: 'Fall event detected. Emergency contact notified.', resolved: true },
];

export const MOCK_PREDICTIONS = [
  { patient_id: 'PD001', prediction_type: 'tremor_severity',    confidence: 0.87, result: { label: 'Moderate-Severe', stage: 3, trend: 'worsening' } },
  { patient_id: 'PD001', prediction_type: 'fall_risk',          confidence: 0.72, result: { label: 'High Risk', score: 0.72, factors: ['gait instability', 'medication timing'] } },
  { patient_id: 'PD002', prediction_type: 'tremor_severity',    confidence: 0.91, result: { label: 'Severe', stage: 4, trend: 'stable' } },
  { patient_id: 'PD002', prediction_type: 'medication_response',confidence: 0.65, result: { label: 'Partial Response', recommendation: 'Consult neurologist for dosage adjustment' } },
  { patient_id: 'PD003', prediction_type: 'tremor_severity',    confidence: 0.84, result: { label: 'Mild-Moderate', stage: 2, trend: 'improving' } },
  { patient_id: 'PD003', prediction_type: 'fall_risk',          confidence: 0.41, result: { label: 'Low Risk', score: 0.41, factors: ['good balance score'] } },
];
