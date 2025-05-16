const CreateReportTable = `CREATE TABLE IF NOT EXISTS reports (
   id SERIAL PRIMARY KEY,
   report_type VARCHAR(50) NOT NULL CHECK (report_type IN ('userReport', 'deliveryReport', 'storeReport')),
   reporter_id INTEGER,
   reported_id INTEGER,
   report_description TEXT NOT NULL,
   created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
   updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)`;
export default CreateReportTable;
