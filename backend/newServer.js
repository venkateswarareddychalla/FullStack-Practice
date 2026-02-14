import express from "express";
import cors from "cors";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

import Database from "better-sqlite3";
import {fileURLToPath} from "url";
import {dirname, join} from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
app.use(express.json());
app.use(cors());

const dbPath = join(__dirname, "newDatabase.db");
const db = new Database(dbPath);


app.listen(3000, () => console.log("app is listening at http://localhost:3000"));




db.prepare(`
        CREATE TABLE IF NOT EXISTS users(
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT NOT NULL UNIQUE,
            password TEXT NOT NULL
        )
    `).run();


// jwt utils
const JWT_SECRET_KEY = "#JWT_SECRET_KEY";
const generateJWTToken = (id) => jwt.sign({id}, JWT_SECRET_KEY, {expiresIn: "30d"});


// register api
app.post("/register", async (req, res) => {
    const {name, email, password} = req.body;

    if (!name || !email || !password){
        return res.status(400).json({message: "All Fields are required"})
    }
    try{
        const userExists = db.prepare(`SELECT * FROM users WHERE email = ?`).get(email);
        if (userExists){
            return res.status(400).json({message: "user already exists"});
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const insert = db.prepare(`INSERT INTO users(name, email, password) VALUES(?, ?, ?)`);
        const result = insert.run(name, email, hashedPassword);
        const token = generateJWTToken(result.lastInsertRowid);
        return res.status(200).json({message: "user registered successfully", token})
    }
    catch(error){
        return res.status(500).json({message: "server error"})
    }

})

// login api
app.post("/login", async (req, res) => {
    const {email, password} = req.body;

    const user = db.prepare(`SELECT * FROM users WHERE email = ?`).get(email);
    if (!user){
        return res.status(400).json({message: "user not found"})
    }

    try{
        const passwordMatched = await bcrypt.compare(password, user.password);
        if (!passwordMatched){
            return res.status(400).json({message: "password not matched"})
        }
        const token = generateJWTToken(user.id);
        res.status(200).json({message: "user login successful", token})
    }
    catch(error){
        return res.status(500).json({message: "server error"});
    }
})


const authenticateMiddleware = (req, res, next) => {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];
    if (!token){
        return res.status(401).json({message: "invalid token"})
    }
    jwt.verify(token, JWT_SECRET_KEY, (error, payload) => {
        if (error){
            return res.status(403).json({message: "invalid token"})
        }
        req.userId = payload.id;
        next();
    })
}

app.get("/", authenticateMiddleware, (req, res) => res.send("API is working"));