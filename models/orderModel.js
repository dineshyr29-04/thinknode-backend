const pool = require('../config/database');

const orderModel = {
    create: async (orderData) => {
        const { customer_name, email, service_type, project_title, description, customization, budget, deadline, files } = orderData;

        // We stringify JSON fields
        const customJson = customization ? JSON.stringify(customization) : null;
        const filesJson = files ? JSON.stringify(files) : null;

        const [result] = await pool.query(
            `INSERT INTO orders 
      (customer_name, email, service_type, project_title, description, customization, budget, deadline, files) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [customer_name, email, service_type, project_title, description, customJson, budget, deadline, filesJson]
        );

        return result.insertId;
    },

    findAll: async () => {
        const [rows] = await pool.query('SELECT * FROM orders ORDER BY created_at DESC');
        return rows;
    },

    findById: async (id) => {
        const [rows] = await pool.query('SELECT * FROM orders WHERE id = ?', [id]);
        return rows[0];
    },

    updateStatus: async (id, status) => {
        const [result] = await pool.query('UPDATE orders SET status = ? WHERE id = ?', [status, id]);
        return result.affectedRows;
    },

    delete: async (id) => {
        const [result] = await pool.query('DELETE FROM orders WHERE id = ?', [id]);
        return result.affectedRows;
    },

    addFileRecord: async (orderId, filePath, originalName) => {
        const [result] = await pool.query(
            'INSERT INTO files (order_id, file_path, original_name) VALUES (?, ?, ?)',
            [orderId, filePath, originalName]
        );
        return result.insertId;
    },

    getFilesByOrderId: async (orderId) => {
        const [rows] = await pool.query('SELECT * FROM files WHERE order_id = ?', [orderId]);
        return rows;
    }
};

module.exports = orderModel;
