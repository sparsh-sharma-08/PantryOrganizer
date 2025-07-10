const db = require('./database');

db.all('SELECT id, name, email FROM users', [], (err, rows) => {
  if (err) {
    console.error('Error fetching users:', err);
    process.exit(1);
  }
  if (rows.length === 0) {
    console.log('No users found.');
  } else {
    console.log('Users:');
    rows.forEach(row => {
      console.log(`ID: ${row.id}, Name: ${row.name}, Email: ${row.email}`);
    });
  }
  process.exit(0);
}); 