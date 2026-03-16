const pool = require('../config/database');

const adminModel = {
    findByUsername: async (username) => {
        const result = await pool.query('SELECT * FROM admins WHERE username = $1', [username]);
        return result.rows[0];
    },
    findById: async (id) => {
        const result = await pool.query('SELECT id, username, email, created_at FROM admins WHERE id = $1', [id]);
        return result.rows[0];
    },
    create: async (adminData) => {
        const { username, email, password } = adminData;
        const result = await pool.query(
            'INSERT INTO admins (username, email, password) VALUES ($1, $2, $3) RETURNING id',
            [username, email, password]
        );
        return result.rows[0].id;
    }
};

module.exports = adminModel;
