// import express from "express";
// import sqlite3 from "sqlite3";
// import { open } from "sqlite";
// import cors from "cors";
// import bcrypt from "bcrypt";
// import jwt from "jsonwebtoken";
// import { fileURLToPath } from "url"; // It changes a file URL (like file:///C:/project/app.js) → into a normal file path (C:\project\app.js).
// import { dirname, join } from "path"; // dirname() → tells you the folder name of a file, join() → helps you combine paths safely (so you don’t mess up slashes).

// const __filename = fileURLToPath(import.meta.url); //import.meta.url means “the URL of this file.” fileURLToPath() turns that URL into the real file path. So now __filename = the full path of this file.
// const __dirname = dirname(__filename); // Takes the full file path and gives you just the folder name.So now __dirname = the folder where this file is.

// const app = express();

// // middlewares
// app.use(express.json());
// app.use(cors());

// const dbPath = join(__dirname, "database.db");
// let db = null;

// const initializeDBAndServer = async () => {
//   try {
//     db = await open({
//       filename: dbPath,
//       driver: sqlite3.Database,
//     });

//     await db.exec(`
//             CREATE TABLE IF NOT EXISTS users(
//             id INTEGER PRIMARY KEY AUTOINCREMENT,
//             name VARCHAR(250) NOT NULL,
//             email VARCHAR(250) UNIQUE,
//             password VARCHAR(250)
//             );`);

//     await db.exec(`
//                 CREATE TABLE IF NOT EXISTS tasks(
//                 id INTEGER PRIMARY KEY AUTOINCREMENT,
//                 title VARCHAR(250),
//                 priority VARCHAR(50),
//                 dueDate VARCHAR(50),
//                 createdAT VARCHAR(50) DEFAULT CURRENT_TIMESTAMP,
//                 userId INTEGER,
//                 FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE);
//                 `);

//     app.listen(3000, () => {
//       console.log("Server is listening at http://localhost:3000/");
//     });
//   } catch (error) {
//     console.log(`DB Error: ${error.message}`);
//     process.exit(1);
//   }
// };

// initializeDBAndServer();





// // health
// app.get('/', (req, res) => {
//     res.send("Api is Working")
// })


// const JWT_SECRET_KEY = "#JWT_SECRET_KEY"
// const generateJWTToken = async (id) => {
//     return jwt.sign({id}, JWT_SECRET_KEY, {expiresIn: "30d"})
// }


// // 1. Register User API
// app.post('/register', async (req, res) => {
//     const {name, email, password} = req.body;

//     if (!name || !email || !password){
//         return res.status(400).json({success: false, message: "Name, Email and Password are required"})
//     }


//     try {

//         const userExists = await db.get(`SELECT * FROM users WHERE email = ?`, [email]);
//         if (userExists){
//             return res.status(400).json({success: false, message: "User already exists"})
//         }

//         const genSalt = await bcrypt.genSalt(10);
//         const hashedPassword = await bcrypt.hash(password, genSalt);

//         const newUser = await db.run(`
//                 INSERT INTO users(name, email, password)
//                 VALUES(?, ?, ?)
//             `, [name, email, hashedPassword]);

//         const token = await generateJWTToken(newUser.lastID)
        
//         res.status(200).json({success: true, message: "User Registered Successfully", token})
        
//     } catch (error) {
//         console.log(error);
//         res.status(500).json({success: false, message: "Server Error"})
//     }
// })


// // 2. Login User API
// app.post('/login', async (req, res) => {
//     const {email, password} = req.body;

//     const user = await db.get(`SELECT * FROM users WHERE email = ?`, [email]);

//     if(!user){
//         return res.status(400).json({success: false, message: "Invalid User"})
//     }

//     try {
//         const validPassword = await bcrypt.compare(password, user.password);
//         if (!validPassword){
//             return res.status(400).json({success: false, message: "Invalid Password"})
//         }

//         const token = await generateJWTToken(user.id);
//         return res.status(200).json({success: true, message: "Login Successful", token})
//     } catch (error) {
        
//     }

// })


// // authentication middleware
// const authenticateToken = (req, res, next) => {
//     const authHeader = req.headers['authorization']; // req.headers['Authorization'] will be undefined, we should use req.headers['authorization'];
//     const token = authHeader && authHeader.split(' ')[1];

//     if(!token){
//         return res.status(401).json({success: false, message: "Invalid Token"});
//         console.log("No token")
//     }

//     jwt.verify(token, JWT_SECRET_KEY, (error, payload) => {
//         if(error){
//             return res.status(403).json({success: false, message: "Invalid Token"}) // 403 -> forbidden
//         }

//         req.userId = payload.id;
//         next();
//     })
// }


// // 3. Add Task API
// app.post('/tasks', authenticateToken, async (req, res) => {
//     const {title, priority, dueDate} = req.body;

//     if(!title || !priority || !dueDate){
//         return res.status(400).json({success: false, message: "Title, Priority and Due Date are required"})
//     }
//     // What happens when a Date object is converted to a number
//     // JavaScript converts a Date object to milliseconds since Jan 1, 1970 internally.
//     // const due = new Date("2025-10-10");
//     // console.log(Number(due)); // 1741785600000 → a valid number
//     // If the Date is invalid, conversion to number gives NaN:
//     // const due = new Date("hello");
//     // console.log(Number(due)); // NaN
//     const due = new Date(dueDate);
//     if(isNaN(due)) return res.status(400).json({success: false, message: "Invalid Due Date"});

//     await db.run(`
//             INSERT INTO tasks(title, priority, dueDate, userId)
//             VALUES(?, ?, ?, ?);
//         `, [title, priority, dueDate, req.userId]);

//     return res.status(200).json({success: true, message: "Task Added Successfully"})
// })


// // 4. get tasks api sorted by priority and due date
// const priorityOrder = { High: 1, Medium: 2, Low: 3 };

// app.get('/tasks', authenticateToken, async (req, res) => {
//     const tasks = await db.all(`SELECT * FROM tasks WHERE userId = ?`, [req.userId]);

//     tasks.sort((a,b) => {
//         if (priorityOrder[a.priority] !== priorityOrder[b.priority]){
//             return priorityOrder[a.priority] - priorityOrder[b.priority];
//         }
//         if (a.dueDate !== b.dueDate){
//             return new Date(a.dueDate) - new Date(b.dueDate); // Internally, JS stores a Date object as milliseconds since Jan 1, 1970 (Unix epoch).
//         }
//         return new Date(a.createdAT) - new Date(b.createdAT);
//     })

//     return res.status(200).json({success: true, tasks});
// })


// // 5. Update Task API
// app.put('/tasks/:id', authenticateToken, async (req, res) => {
//     const {id} = req.params;
//     const {title, priority, dueDate} = req.body;

//     await db.run(`UPDATE tasks SET title = ?, priority = ?, dueDate = ? WHERE id = ? AND userId = ?`, [title, priority, dueDate, id, req.userId]);

//     return res.status(200).json({success: true, message: "Task Updated Successfully"});
// })


// // 6. Delete Task API
// app.delete('/tasks/:id', authenticateToken, async (req, res) => {
//     const {id} = req.params;
//     await db.run(`DELETE FROM tasks WHERE id=? AND userId=? `, [id, req.userId]);

//     return res.status(200).json({success: true, message: "Task Deleted Successfully"});
// })








// better sqlite3


import express from "express";
import cors from "cors";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

import Database from "better-sqlite3";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

// Setup paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Express app
const app = express();
app.use(express.json());
app.use(cors());

// DB initialization
const dbPath = join(__dirname, "database.db");
const db = new Database(dbPath);

// Create tables if not exist
db.prepare(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE,
    password TEXT
  );
`).run();

db.prepare(`
  CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    priority TEXT,
    dueDate TEXT,
    createdAT TEXT DEFAULT CURRENT_TIMESTAMP,
    userId INTEGER,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
  );
`).run();

// Start server
app.listen(3000, () => console.log("Server running at http://localhost:3000/"));

// Health check
app.get("/", (req, res) => res.send("API is Working"));

// JWT utils
const JWT_SECRET_KEY = "#JWT_SECRET_KEY";
const generateJWTToken = (id) => jwt.sign({ id }, JWT_SECRET_KEY, { expiresIn: "30d" });

// --------------------- USER APIs ---------------------

// Register
app.post("/register", async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password)
    return res
      .status(400)
      .json({ success: false, message: "Name, Email and Password are required" });

  try {
    const userExists = db.prepare(`SELECT * FROM users WHERE email = ?`).get(email);
    if (userExists)
      return res.status(400).json({ success: false, message: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const insert = db.prepare(`INSERT INTO users(name, email, password) VALUES(?, ?, ?)`);
    const result = insert.run(name, email, hashedPassword);

    const token = generateJWTToken(result.lastInsertRowid);
    res.status(200).send("registered successfully");
  } catch (error) {
    console.log(error);
    res.status(500).send({ success: false, message: "Server Error" });
  }
});

// Login
app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const user = db.prepare(`SELECT * FROM users WHERE email = ?`).get(email);

  if (!user)
    return res.status(400).json({ success: false, message: "Invalid User" });

  try {
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword)
      return res.status(400).json({ success: false, message: "Invalid Password" });

    const token = generateJWTToken(user.id);
    return res.status(200).json({ success: true, message: "Login Successful", token });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
});

// --------------------- AUTH MIDDLEWARE ---------------------

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token)
    return res.status(401).json({ success: false, message: "Invalid Token" });

  jwt.verify(token, JWT_SECRET_KEY, (error, payload) => {
    if (error)
      return res.status(403).json({ success: false, message: "Invalid Token" });
    req.userId = payload.id;
    next();
  });
};

// --------------------- TASK APIs ---------------------

// Add Task
app.post("/tasks", authenticateToken, (req, res) => {
  const { title, priority, dueDate } = req.body;

  if (!title || !priority || !dueDate)
    return res
      .status(400)
      .json({ success: false, message: "Title, Priority and Due Date are required" });

  const due = new Date(dueDate);
  if (isNaN(due)) return res.status(400).json({ success: false, message: "Invalid Due Date" });

  db.prepare(
    `INSERT INTO tasks(title, priority, dueDate, userId) VALUES(?, ?, ?, ?)`
  ).run(title, priority, dueDate, req.userId);

  return res.status(200).json({ success: true, message: "Task Added Successfully" });
});

// Get Tasks (sorted by priority + due date)
const priorityOrder = { High: 1, Medium: 2, Low: 3 };

app.get("/tasks", authenticateToken, (req, res) => {
  const tasks = db.prepare(`SELECT * FROM tasks WHERE userId = ?`).all(req.userId);

  tasks.sort((a, b) => {
    if (priorityOrder[a.priority] !== priorityOrder[b.priority])
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    if (a.dueDate !== b.dueDate)
      return new Date(a.dueDate) - new Date(b.dueDate);
    return new Date(a.createdAT) - new Date(b.createdAT);
  });

  return res.status(200).json({ success: true, tasks });
});

// Update Task
app.put("/tasks/:id", authenticateToken, (req, res) => {
  const { id } = req.params;
  const { title, priority, dueDate } = req.body;

  db.prepare(
    `UPDATE tasks SET title = ?, priority = ?, dueDate = ? WHERE id = ? AND userId = ?`
  ).run(title, priority, dueDate, id, req.userId);

  return res.status(200).json({ success: true, message: "Task Updated Successfully" });
});

// Delete Task
app.delete("/tasks/:id", authenticateToken, (req, res) => {
  const { id } = req.params;
  db.prepare(`DELETE FROM tasks WHERE id = ? AND userId = ?`).run(id, req.userId);

  return res.status(200).json({ success: true, message: "Task Deleted Successfully" });
});
