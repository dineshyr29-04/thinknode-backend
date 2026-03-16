const pool = require('../config/database');

const orderModel = {
    create: async (orderData) => {
        const { customer_name, email, service_type, project_title, description, customization, budget, deadline, files } = orderData;

        // We stringify JSON fields
        const customJson = customization ? JSON.stringify(customization) : null;
        const filesJson = files ? JSON.stringify(files) : null;

        const result = await pool.query(
            `INSERT INTO orders 
      (customer_name, email, service_type, project_title, description, customization, budget, deadline, files) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
            [customer_name, email, service_type, project_title, description, customJson, budget, deadline, filesJson]
        );

        return result.rows[0].id;
    },

    findAll: async () => {
        const result = await pool.query('SELECT * FROM orders ORDER BY created_at DESC');
        return result.rows;
    },

    findById: async (id) => {
        const result = await pool.query('SELECT * FROM orders WHERE id = $1', [id]);
        return result.rows[0];
    },

    updateStatus: async (id, status) => {
        const result = await pool.query('UPDATE orders SET status = $1 WHERE id = $2', [status, id]);
        return result.rowCount;
    },

    delete: async (id) => {
        const result = await pool.query('DELETE FROM orders WHERE id = $1', [id]);
        return result.rowCount;
    },

    addFileRecord: async (orderId, filePath, originalName) => {
        const result = await pool.query(
            'INSERT INTO files (order_id, file_path, original_name) VALUES ($1, $2, $3) RETURNING id',
            [orderId, filePath, originalName]
        );
        return result.rows[0].id;
    },

    getFilesByOrderId: async (orderId) => {
        const result = await pool.query('SELECT * FROM files WHERE order_id = $1', [orderId]);
        return result.rows;
    }
};

module.exports = orderModel;
