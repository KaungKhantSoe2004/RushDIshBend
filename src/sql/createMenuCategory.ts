const CreateMenuCategoryTable = `CREATE TABLE IF NOT EXISTS menu_category (
  id SERIAL PRIMARY KEY,
  store_id INTEGER NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  icon TEXT NULL,
  is_active VARCHAR(20) DEFAULT 'true',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE
)`;
export default CreateMenuCategoryTable;
