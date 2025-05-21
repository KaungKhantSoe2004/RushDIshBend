const CreatePaymentsTable = `CREATE TABLE IF NOT EXISTS payments (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL ,                        
  order_id INTEGER NOT NULL ,                            
  amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),                   
  method VARCHAR(30) NOT NULL ENUM('cash'), 'wave money', 'AYA pay', 'KBZ pay'),                     
  status VARCHAR(20) DEFAULT 'paid',                
  paid_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  note TEXT,                                        
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (order_id) REFERENCES orders(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
`;
export default CreatePaymentsTable;
