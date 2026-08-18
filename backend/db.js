const mysql = require("mysql2");

const db = mysql.createConnection({
  host: "localhost",
  port: 3400,
  user: "root",
  password: "rootpassword",
  database: "sptc",
});

db.connect((err) => {
  if (err) {
    console.error("MySQL Error:", err);
  } else {
    console.log("MySQL Connected");
  }
});

module.exports = db;
