const createNotificationsTable = `CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  noti_type VARCHAR(200) NOT NULL,
  user_id integer NOT NULL,
  message VARCHAR(300),
  status VARCHAR(100),
  recipient VARCHAR(100),
  FOREIGN KEY (user_id) REFERENCES users(id),
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) `;
export default createNotificationsTable;
