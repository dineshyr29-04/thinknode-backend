const pool = require('../config/database');

const Customer = {
    async create(customerData) {
        const { username, email, password, full_name, phone, company_name } = customerData;
        const query = `
            INSERT INTO customers (username, email, password, full_name, phone, company_name)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING id, username, email, full_name, phone, company_name, created_at
        `;

        const result = await pool.query(query, [username, email, password, full_name || null, phone || null, company_name || null]);
        return result.rows[0];
    },

    async findByEmail(email) {
        const query = 'SELECT * FROM customers WHERE email = $1';
        const result = await pool.query(query, [email]);
        return result.rows[0];
    },

    async findByUsername(username) {
        const query = 'SELECT * FROM customers WHERE username = $1';
        const result = await pool.query(query, [username]);
        return result.rows[0];
    },

    async findById(id) {
        const query = 'SELECT id, username, email, full_name, phone, company_name, status, created_at FROM customers WHERE id = $1';
        const result = await pool.query(query, [id]);
        return result.rows[0];
    },

    async updateProfile(id, updateData) {
        const { full_name, phone, company_name, profile_picture } = updateData;
        const query = `
            UPDATE customers 
            SET full_name = COALESCE($1, full_name), 
                phone = COALESCE($2, phone), 
                company_name = COALESCE($3, company_name),
                profile_picture = COALESCE($4, profile_picture),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $5
            RETURNING id, username, email, full_name, phone, company_name, profile_picture, status
        `;

        const result = await pool.query(query, [full_name, phone, company_name, profile_picture, id]);
        return result.rows[0];
    },

    async getAllCustomers() {
        const query = 'SELECT id, username, email, full_name, phone, company_name, status, created_at FROM customers ORDER BY created_at DESC';
        const result = await pool.query(query);
        return result.rows;
    }
};

module.exports = Customer;
