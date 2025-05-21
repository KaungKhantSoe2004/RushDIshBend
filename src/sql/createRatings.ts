const CreateRatingsTable = `
CREATE TABLE IF NOT EXISTS ratings (
id SERIAL PRIMARY KEY,
user_id INTEGER NOT NULL,
message VARCHAR(1500) NOT NULL DEFAULT '',
rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
FOREIGN KEY (user_id) REFERENCES users(id),
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
`;
export default CreateRatingsTable;
