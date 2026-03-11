const db = require('../config/database');

class User {
    static async create({ username, email, password }) {
        try {
            const [result] = await db.execute(
                'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
                [username, email, password]
            );
            return result.insertId;
        } catch (error) {
            throw error;
        }
    }

    static async findByEmail(email) {
        try {
            const [rows] = await db.execute(
                'SELECT * FROM users WHERE email = ?',
                [email]
            );
            return rows[0];
        } catch (error) {
            throw error;
        }
    }

    static async findByUsername(username) {
        try {
            const [rows] = await db.execute(
                'SELECT * FROM users WHERE username = ?',
                [username]
            );
            return rows[0];
        } catch (error) {
            throw error;
        }
    }
}

module.exports = User;
