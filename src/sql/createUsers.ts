const CreateUsersTable = `CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  phone_one VARCHAR(15) UNIQUE NOT NULL,
  phone_two VARCHAR(15),
  email VARCHAR(100),
  address_one TEXT,
  address_two TEXT,
  role VARCHAR(20) DEFAULT 'user',
  account_status VARCHAR(20) DEFAULT 'accepted',
  points INTEGER DEFAULT 0,
  login_code VARCHAR(10),
  password_hash VARCHAR(255) NOT NULL,
  is_active VARCHAR(20) DEFAULT 'active',
  profile VARCHAR(255) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
`;
export default CreateUsersTable;
