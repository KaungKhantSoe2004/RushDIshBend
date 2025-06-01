const createActivityTable = `CREATE TABLE IF　NOT EXISTS activities (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  type VARCHAR(100),
  description VARCHAR(300),
  FOREIGN KEY (user_id) REFERENCES users(id),
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) `;
export default createActivityTable;
