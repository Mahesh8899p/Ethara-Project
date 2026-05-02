const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function setupDatabase() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true
  });

  try {
    const schema = fs.readFileSync(path.join(__dirname, '../../schema.sql'), 'utf8');
    await connection.query(schema);
    console.log('Database and tables created successfully!');
  } catch (error) {
    console.error('Error setting up database:', error.message);
  } finally {
    await connection.end();
  }
}

setupDatabase();
