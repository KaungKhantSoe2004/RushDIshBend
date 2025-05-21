const CreateStoresTable = `CREATE TABLE IF NOT EXISTS stores (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  phone_one VARCHAR(15) UNIQUE NOT NULL,
  phone_two VARCHAR(15),
  email VARCHAR(100),
  address_one TEXT,
  address_two TEXT,
  account_status VARCHAR(20) DEFAULT 'active',
  profile TEXT,
  promotion_one INTEGER,
  promotion_two INTEGER,
  promotion_three INTEGER,
  promotion_four INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  password_hash VARCHAR(255) NOT NULL,  
  FOREIGN KEY (promotion_one) REFERENCES promotions(id),
  FOREIGN KEY (promotion_two) REFERENCES promotions(id),
  FOREIGN KEY (promotion_three) REFERENCES promotions(id),
  FOREIGN KEY (promotion_four) REFERENCES promotions(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
`;

export default CreateStoresTable;
