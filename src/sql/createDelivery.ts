const CreateDeliveryAgentTable = `
CREATE TABLE IF NOT EXISTS delivery_agents (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  phone_one VARCHAR(15) UNIQUE NOT NULL,
  phone_two VARCHAR(15),
  email VARCHAR(100) UNIQUE NOT NULL,
  profile TEXT,
  vehicle_type VARCHAR(50) NOT NULL,
  vehicle_number VARCHAR(20) NOT NULL,
  current_latitude DECIMAL(9,6),
  current_longitude DECIMAL(9,6),
  last_login TIMESTAMP,
  address_one TEXT,
  address_two TEXT,
  account_status VARCHAR(20) DEFAULT 'active',
  points INTEGER DEFAULT 0,
  login_code VARCHAR(10),
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
`;
export default CreateDeliveryAgentTable;
