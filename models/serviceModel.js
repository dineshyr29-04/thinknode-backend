const pool = require('../config/database');

const serviceModel = {
    findAll: async () => {
        const result = await pool.query('SELECT * FROM services ORDER BY created_at DESC');
        return result.rows;
    },
    findById: async (id) => {
        const result = await pool.query('SELECT * FROM services WHERE id = $1', [id]);
        return result.rows[0];
    },
    create: async (serviceData) => {
        const { name, description, price_range, delivery_time } = serviceData;
        const result = await pool.query(
            'INSERT INTO services (name, description, price_range, delivery_time) VALUES ($1, $2, $3, $4) RETURNING id',
            [name, description, price_range, delivery_time]
        );
        return result.rows[0].id;
    },
    update: async (id, serviceData) => {
        const { name, description, price_range, delivery_time } = serviceData;
        const result = await pool.query(
            'UPDATE services SET name = $1, description = $2, price_range = $3, delivery_time = $4 WHERE id = $5',
            [name, description, price_range, delivery_time, id]
        );
        return result.rowCount;
    },
    delete: async (id) => {
        const result = await pool.query('DELETE FROM services WHERE id = $1', [id]);
        return result.rowCount;
    }
};

module.exports = serviceModel;
