# ThinkNode Backend API Guide 🚀

This document provides a comprehensive, "very explained" manual for the ThinkNode Backend. It covers what data the backend expects (Inputs) and what it does with that data (Processing/Logic).

---

## 🏗️ 1. Core Architecture & Security
The backend is built with **Node.js, Express, and PostgreSQL**. It uses **JWT (JSON Web Tokens)** for secure communication and **Socket.io** for real-time events.

### **🔐 Security Layers**
- **Helmet**: Automatically sets 15+ secure HTTP headers to protect against common attacks (XSS, Clickjacking, etc.).
- **Rate Limiting**: Limits EACH IP address to **100 requests every 15 minutes**. If exceeded, it returns a `429 Too Many Requests` error.
- **CORS**: Only allows authorized frontends (defined in `.env`) to talk to the API.
- **PNA (Private Network Access)**: Configured to support modern browser security checks for local/private development.

---

## 🔑 2. Authentication (Identity Management)
The backend manages two distinct types of users: **Admins** and **Customers**. Each has their own database table and logic.

### **What the Backend Takes (Inputs):**
- **Registration**: Needs `username`, `email`, and `password`. (Customers can also provide `full_name`, `phone`, and `company_name`).
- **Login**: Needs `email` and `password`.

### **What the Backend Does (Logic):**
1.  **Verification**: Checks if the email is already registered.
2.  **Encryption**: Uses `bcrypt` to hash passwords before saving (it NEVER saves plain text passwords).
3.  **Token Issuance**: Generates a **30-day JWT token** containing the user's ID and role (`admin` or `customer`).
4.  **Response**: Returns the user profile and the `token` at the **root of the JSON response**.

---

## 📦 3. Project & Order Management
This is the heart of the platform where customers place orders for services (e.g., Video Editing, Graphic Design).

### **What the Backend Takes (Inputs):**
- **Order Creation**: 
    - `service_type` (Required)
    - `project_title` (Required)
    - `description`, `budget`, `deadline` (Optional)
    - `customization` (JSON object for specific requirements)
    - `files` (Multipart file upload - up to 5 files, 10MB limit each)
- **Token**: The `Authorization: Bearer <token>` header is REQUIRED.

### **What the Backend Does (Logic):**
1.  **Ownership Linking**: Extracts the `customer_id` from the secure token and links the order to that specific user.
2.  **File Processing**: Saves uploaded files to the `/uploads` directory and creates searchable records in the `files` database table.
3.  **Data Integrity**: Ensures the order is saved securely and can only be accessed by the owner or an admin.
4.  **Event Emission**: Notifies connected admins via **Socket.io** that a new order has been placed.

---

## 🛠️ 4. API Endpoint Summary

### **👤 Customer Portal**
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/customer/register` | Create a new customer account. |
| `POST` | `/api/customer/login` | Log in and get a 30-day token. |
| `GET` | `/api/customer/profile` | (Auth Required) Get your own profile data. |
| `POST` | `/api/customer/orders` | (Auth Required) Submit a new project with files. |
| `GET` | `/api/customer/my-orders` | (Auth Required) Fetch ONLY your own project history. |

### **👑 Admin Dashboard**
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/admin/login` | Administrative log in. |
| `GET` | `/api/admin/orders` | (Admin Required) View ALL projects from ALL customers. |
| `PATCH` | `/api/admin/orders/:id/status` | (Admin Required) Change project status (Pending, In-Progress, etc.). |
| `GET` | `/api/services` | View available services for sale. |
| `POST` | `/api/services` | (Admin Required) Add a new service offering. |

---

## 📡 5. Real-Time Socket.io Events
The backend "shouts" updates to the frontend as things happen:
- `customer:registered`: Sent when a new user joins.
- `customer:loggedIn`: Sent when a user logs in.
- `customer:profileUpdated`: Sent when a profile change occurs.
- `admin:notification`: (Internal logic) for alerting admins of new tasks.

---

## 🏗️ 6. Scaling & Production Readiness
- **Database Pooling**: Configured to handle 100+ concurrent users with efficient connection management (max 20 connections, 30s idle timeout).
- **Error Handling**: Standardized error responses (e.g., `401 Unauthorized`, `404 Not Found`) with clean JSON logs for debugging.
- **Environment Driven**: All sensitive keys (DB keys, JWT secrets) are kept in `.env` and never hardcoded.
