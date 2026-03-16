const pool = require('../config/database');

const serviceModel = {
    findAll: async () => {
        const [rows] = await pool.query('SELECT * FROM services ORDER BY created_at DESC');
        return rows;
    },
    findById: async (id) => {
        const [rows] = await pool.query('SELECT * FROM services WHERE id = ?', [id]);
        return rows[0];
    },
    create: async (serviceData) => {
        const { name, description, price_range, delivery_time } = serviceData;
        const [result] = await pool.query(
            'INSERT INTO services (name, description, price_range, delivery_time) VALUES (?, ?, ?, ?)',
            [name, description, price_range, delivery_time]
        );
        return result.insertId;
    },
    update: async (id, serviceData) => {
        const { name, description, price_range, delivery_time } = serviceData;
        const [result] = await pool.query(
            'UPDATE services SET name = ?, description = ?, price_range = ?, delivery_time = ? WHERE id = ?',
            [name, description, price_range, delivery_time, id]
        );
        return result.affectedRows;
    },
    delete: async (id) => {
        const [result] = await pool.query('DELETE FROM services WHERE id = ?', [id]);
        return result.affectedRows;
    }
};

module.exports = serviceModel;
