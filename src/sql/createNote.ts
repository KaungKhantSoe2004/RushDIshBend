const createNotesTable = `CREATE TABLE IF NOT EXISTS notes (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  type VARCHAR(100),
  description VARCHAR(300),
  FOREIGN KEY (user_id) REFERENCES users(id),
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) `;
export default createNotesTable;
