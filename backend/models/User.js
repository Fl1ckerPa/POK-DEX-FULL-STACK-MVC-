const db = require('../config/database');
const bcrypt = require('bcryptjs');

class User {
    static async findByEmail(email) {
        try {
            const [rows] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
            return rows[0];
        } catch (error) {
            throw error;
        }
    }

    static async findById(id) {
        try {
            const [rows] = await db.execute('SELECT id, username, email FROM users WHERE id = ?', [id]);
            return rows[0];
        } catch (error) {
            throw error;
        }
    }

    static async findByUsername(username) {
        try {
            const [rows] = await db.execute('SELECT * FROM users WHERE username = ?', [username]);
            return rows[0];
        } catch (error) {
            throw error;
        }
    }

    static async create(userData) {
        try {
            const { username, email, password } = userData;
            const [result] = await db.execute(
                'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
                [username, email, password]
            );
            return result.insertId;
        } catch (error) {
            throw error;
        }
    }

    static async comparePassword(plainPassword, hashedPassword) {
        return await bcrypt.compare(plainPassword, hashedPassword);
    }
}

module.exports = User;
