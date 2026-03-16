const pool = require('../config/database');

const adminModel = {
    findByUsername: async (username) => {
        const [rows] = await pool.query('SELECT * FROM admins WHERE username = ?', [username]);
        return rows[0];
    },
    findById: async (id) => {
        const [rows] = await pool.query('SELECT id, username, email, created_at FROM admins WHERE id = ?', [id]);
        return rows[0];
    },
    create: async (adminData) => {
        const { username, email, password } = adminData;
        const [result] = await pool.query(
            'INSERT INTO admins (username, email, password) VALUES (?, ?, ?)',
            [username, email, password]
        );
        return result.insertId;
    }
};

module.exports = adminModel;
