# Frontend Implementation Guide - Customer Registration & Login

## 1. API ENDPOINTS

Your backend now has these new customer authentication endpoints:

### Register Customer
```
POST /api/auth/customer/register
Content-Type: application/json

Request Body:
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "password123",
  "full_name": "John Doe",
  "phone": "1234567890",
  "company_name": "ABC Company"
}

Response (201):
{
  "success": true,
  "message": "Customer registered successfully",
  "data": {
    "id": 1,
    "username": "john_doe",
    "email": "john@example.com",
    "full_name": "John Doe",
    "phone": "1234567890",
    "company_name": "ABC Company",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### Login Customer
```
POST /api/auth/customer/login
Content-Type: application/json

Request Body:
{
  "email": "john@example.com",
  "password": "password123"
}

Response (200):
{
  "success": true,
  "message": "Login successful",
  "data": {
    "id": 1,
    "username": "john_doe",
    "email": "john@example.com",
    "full_name": "John Doe",
    "phone": "1234567890",
    "company_name": "ABC Company",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### Get Customer Profile
```
GET /api/auth/customer/profile
Authorization: Bearer [token]

Response (200):
{
  "success": true,
  "data": {
    "id": 1,
    "username": "john_doe",
    "email": "john@example.com",
    "full_name": "John Doe",
    "phone": "1234567890",
    "company_name": "ABC Company",
    "status": "active",
    "created_at": "2024-03-23T10:00:00Z"
  }
}
```

### Update Customer Profile
```
PUT /api/auth/customer/profile
Authorization: Bearer [token]
Content-Type: application/json

Request Body:
{
  "full_name": "John Updated",
  "phone": "9876543210",
  "company_name": "XYZ Company",
  "profile_picture": "/uploads/profile.jpg"
}

Response (200):
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "id": 1,
    "username": "john_doe",
    "email": "john@example.com",
    "full_name": "John Updated",
    "phone": "9876543210",
    "company_name": "XYZ Company",
    "profile_picture": "/uploads/profile.jpg",
    "status": "active"
  }
}
```

---

## 2. REACT EXAMPLE CODE

### Step 1: Install Required Packages
```bash
npm install axios socket.io-client
```

### Step 2: Create Authentication Context
Create `src/context/AuthContext.js`:

```javascript
import React, { createContext, useState, useContext } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [customer, setCustomer] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('customerToken') || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const registerCustomer = async (formData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('http://localhost:5000/api/auth/customer/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      setToken(data.data.token);
      setCustomer(data.data);
      localStorage.setItem('customerToken', data.data.token);
      localStorage.setItem('customer', JSON.stringify(data.data));

      return data.data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const loginCustomer = async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('http://localhost:5000/api/auth/customer/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      setToken(data.data.token);
      setCustomer(data.data);
      localStorage.setItem('customerToken', data.data.token);
      localStorage.setItem('customer', JSON.stringify(data.data));

      return data.data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setCustomer(null);
    setToken(null);
    localStorage.removeItem('customerToken');
    localStorage.removeItem('customer');
  };

  const updateProfile = async (updateData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('http://localhost:5000/api/auth/customer/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(updateData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Update failed');
      }

      setCustomer(data.data);
      localStorage.setItem('customer', JSON.stringify(data.data));

      return data.data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      customer, 
      token, 
      loading, 
      error, 
      registerCustomer, 
      loginCustomer, 
      logout,
      updateProfile 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
```

### Step 3: Create Registration Component
Create `src/components/RegisterForm.jsx`:

```javascript
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const RegisterForm = () => {
  const { registerCustomer, loading, error } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    full_name: '',
    phone: '',
    company_name: ''
  });
  const [formError, setFormError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    try {
      await registerCustomer(formData);
      // Registration successful - redirect to dashboard or login
      navigate('/dashboard');
    } catch (err) {
      setFormError(err.message);
    }
  };

  return (
    <div className="register-container">
      <h2>Customer Registration</h2>
      
      {formError && <div className="error-message">{formError}</div>}
      {error && <div className="error-message">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Username *</label>
          <input
            type="text"
            name="username"
            value={formData.username}
            onChange={handleChange}
            required
            placeholder="Enter username"
          />
        </div>

        <div className="form-group">
          <label>Email *</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            placeholder="Enter email"
          />
        </div>

        <div className="form-group">
          <label>Password *</label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
            placeholder="Enter password"
          />
        </div>

        <div className="form-group">
          <label>Full Name</label>
          <input
            type="text"
            name="full_name"
            value={formData.full_name}
            onChange={handleChange}
            placeholder="Enter full name"
          />
        </div>

        <div className="form-group">
          <label>Phone</label>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            placeholder="Enter phone number"
          />
        </div>

        <div className="form-group">
          <label>Company Name</label>
          <input
            type="text"
            name="company_name"
            value={formData.company_name}
            onChange={handleChange}
            placeholder="Enter company name"
          />
        </div>

        <button type="submit" disabled={loading}>
          {loading ? 'Registering...' : 'Register'}
        </button>
      </form>

      <p>Already have an account? <a href="/login">Login here</a></p>
    </div>
  );
};

export default RegisterForm;
```

### Step 4: Create Login Component
Create `src/components/LoginForm.jsx`:

```javascript
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const LoginForm = () => {
  const { loginCustomer, loading, error } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [formError, setFormError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    try {
      await loginCustomer(formData.email, formData.password);
      navigate('/dashboard');
    } catch (err) {
      setFormError(err.message);
    }
  };

  return (
    <div className="login-container">
      <h2>Customer Login</h2>
      
      {formError && <div className="error-message">{formError}</div>}
      {error && <div className="error-message">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Email *</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            placeholder="Enter email"
          />
        </div>

        <div className="form-group">
          <label>Password *</label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
            placeholder="Enter password"
          />
        </div>

        <button type="submit" disabled={loading}>
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>

      <p>Don't have an account? <a href="/register">Register here</a></p>
    </div>
  );
};

export default LoginForm;
```

### Step 5: Socket.io integration in App.js
```javascript
import React, { useEffect } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './context/AuthContext';

const socket = io('http://localhost:5000');

function App() {
  const { customer, token } = useAuth();

  useEffect(() => {
    if (token) {
      // Join room with customer ID
      socket.emit('joinRoom', `customer_${customer?.id}`);

      // Listen for notifications
      socket.on('notification:received', (data) => {
        console.log('Notification received:', data);
        // Display notification to user
      });

      // Listen for new customer registrations (admin panel)
      socket.on('notification:newCustomer', (data) => {
        console.log('New customer registered:', data);
      });

      return () => {
        socket.emit('leaveRoom', `customer_${customer?.id}`);
        socket.off('notification:received');
        socket.off('notification:newCustomer');
      };
    }
  }, [token, customer?.id]);

  return (
    <div className="App">
      {/* Your app content */}
    </div>
  );
}

export default App;
```

### Step 6: Update Main App setup
Update `src/index.js` or `src/main.jsx`:

```javascript
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>,
);
```

---

## 3. IMPORTANT NOTES

### Environment Variables (Frontend):
Create `.env` file in your React project:
```
VITE_API_BASE_URL=http://localhost:5000
VITE_SOCKET_URL=http://localhost:5000
```

### Token Storage:
- The token is stored in `localStorage` with key `customerToken`
- Always include the token in Authorization header: `Bearer {token}`
- Token expires in 30 days

### CORS Configuration:
- Make sure your backend has CORS enabled for `http://localhost:3000` (or your frontend port)
- Currently configured in `app.js` to allow from `CLIENT_URL` env variable

### Socket.io Events Available:
- `customer:registered` - Emitted when new customer registers
- `customer:loggedIn` - Emitted when customer logs in
- `customer:profileUpdated` - Emitted when profile is updated
- `notification:received` - Send/receive private notifications
- `joinRoom` - Join a room (e.g., for customer-specific updates)
- `leaveRoom` - Leave a room

---

## 4. TESTING

### Register with curl:
```bash
curl -X POST http://localhost:5000/api/auth/customer/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "password123",
    "full_name": "Test User",
    "phone": "1234567890",
    "company_name": "Test Company"
  }'
```

### Login with curl:
```bash
curl -X POST http://localhost:5000/api/auth/customer/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

---

## 5. Next Steps

1. ✅ Backend customer registration implemented
2. ✅ Socket.io events set up
3. Create registration form in React
4. Create login form in React
5. Create customer dashboard
6. Link orders to customers
7. Add real-time order status updates via Socket.io
