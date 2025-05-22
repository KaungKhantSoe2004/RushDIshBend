const CreateOrdersTable = `CREATE TABLE IF NOT EXISTS orders (
id SERIAL PRIMARY KEY,
store_id INTEGER NOT NULL,
user_id INTEGER NOT NULL ,
delivery_id INTEGER NOT NULL,
items JSONB NOT NULL,
item_count INTEGER,
total_amount DECIMAL(13,2) NOT NULL CHECK (total_amount > 0),
pickup_time TIMESTAMP,
is_paid BOOLEAN DEFAULT FALSE,
address VARCHAR(260) NOT NULL,
instuctions VARCHAR(1000) NOT NULL,
customer_pickup_time TIMESTAMP,
promotion_id INTEGER DEFAULT NULL,
status VARCHAR(30) DEFAULT 'pending'  CHECK (
  status IN ('pending', 'completed', 'cancelled', 'in_progress', 'on_the_way', 'delivered', 'returned')
),
FOREIGN KEY (delivery_id) REFERENCES delivery_agents(id),
FOREIGN KEY (user_id) REFERENCES users(id),
FOREIGN KEY (store_id) REFERENCES stores(id),
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)`;
export default CreateOrdersTable;
