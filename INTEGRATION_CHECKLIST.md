# Frontend-Backend Integration Checklist

## ✅ Backend Status: READY FOR FRONTEND

All backend components are correctly implemented and tested.

---

## 📋 FRONTEND REQUIREMENTS CHECKLIST

### **1. Environment Setup**
- [ ] Install dependencies: `npm install axios socket.io-client`
- [ ] Create `.env` file in React project
- [ ] Add environment variables:
  ```
  VITE_API_BASE_URL=http://localhost:5000
  VITE_SOCKET_URL=http://localhost:5000
  ```

### **2. API Service Layer**
Create these files in your React `src/services/` folder:

#### **a. `src/services/api.js`** - API Client with Interceptors
```javascript
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const apiClient = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Auto-attach token to requests
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('customerToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle token expiration
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('customerToken');
      localStorage.removeItem('customer');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;
```

#### **b. `src/services/authService.js`** - Authentication Functions
```javascript
import apiClient from './api';

const authService = {
  registerCustomer: async (formData) => {
    const response = await apiClient.post('/auth/customer/register', formData);
    if (response.data.data.token) {
      localStorage.setItem('customerToken', response.data.data.token);
      localStorage.setItem('customer', JSON.stringify(response.data.data));
    }
    return response.data;
  },

  loginCustomer: async (email, password) => {
    const response = await apiClient.post('/auth/customer/login', { 
      email, 
      password 
    });
    if (response.data.data.token) {
      localStorage.setItem('customerToken', response.data.data.token);
      localStorage.setItem('customer', JSON.stringify(response.data.data));
    }
    return response.data;
  },

  getProfile: async () => {
    const response = await apiClient.get('/auth/customer/profile');
    return response.data;
  },

  updateProfile: async (updateData) => {
    const response = await apiClient.put('/auth/customer/profile', updateData);
    localStorage.setItem('customer', JSON.stringify(response.data.data));
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('customerToken');
    localStorage.removeItem('customer');
  },
};

export default authService;
```

### **3. Authentication Context (Optional but Recommended)**
Create `src/context/AuthContext.jsx`:
```javascript
import React, { createContext, useContext, useState, useEffect } from 'react';
import authService from '../services/authService';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [customer, setCustomer] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(false);

  // Load customer from localStorage on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('customerToken');
    const savedCustomer = localStorage.getItem('customer');
    if (savedToken && savedCustomer) {
      setToken(savedToken);
      setCustomer(JSON.parse(savedCustomer));
    }
  }, []);

  const register = async (formData) => {
    setLoading(true);
    try {
      const result = await authService.registerCustomer(formData);
      setToken(result.data.token);
      setCustomer(result.data);
      return result;
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    setLoading(true);
    try {
      const result = await authService.loginCustomer(email, password);
      setToken(result.data.token);
      setCustomer(result.data);
      return result;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    authService.logout();
    setToken(null);
    setCustomer(null);
  };

  const updateProfile = async (updateData) => {
    setLoading(true);
    try {
      const result = await authService.updateProfile(updateData);
      setCustomer(result.data);
      return result;
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{
      customer,
      token,
      loading,
      register,
      login,
      logout,
      updateProfile,
      isAuthenticated: !!token
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

### **4. Update Login Page**
Update your login page component:

```javascript
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login, loading } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      await login(email, password);
      navigate('/dashboard'); // or your home page
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    }
  };

  return (
    <div className="login-container">
      <h2>Customer Login</h2>
      
      {error && <div className="error-message">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div>
          <label>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div>
          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <button type="submit" disabled={loading}>
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>
    </div>
  );
};

export default LoginPage;
```

### **5. Wrap App with AuthProvider**
Update your `src/main.jsx` or `src/App.jsx`:

```javascript
import { AuthProvider } from './context/AuthContext';

function App() {
  return (
    <AuthProvider>
      {/* Your app routes */}
    </AuthProvider>
  );
}

export default App;
```

### **6. Create Registration Page (If Needed)**
```javascript
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    full_name: '',
    phone: '',
    company_name: ''
  });
  const [error, setError] = useState('');
  const { register, loading } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      await register(formData);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && <div className="error">{error}</div>}
      
      <input name="username" placeholder="Username" onChange={handleChange} required />
      <input name="email" type="email" placeholder="Email" onChange={handleChange} required />
      <input name="password" type="password" placeholder="Password" onChange={handleChange} required />
      <input name="full_name" placeholder="Full Name" onChange={handleChange} />
      <input name="phone" placeholder="Phone" onChange={handleChange} />
      <input name="company_name" placeholder="Company Name" onChange={handleChange} />
      
      <button type="submit" disabled={loading}>
        {loading ? 'Registering...' : 'Register'}
      </button>
    </form>
  );
};

export default RegisterPage;
```

### **7. Socket.io Integration (Optional for Real-time Features)**
Create `src/services/socketService.js`:

```javascript
import io from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

let socket = null;

export const connectSocket = (customerId) => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5
    });

    socket.on('connect', () => {
      console.log('Socket connected:', socket.id);
      // Join customer-specific room
      socket.emit('joinRoom', `customer_${customerId}`);
    });

    socket.on('notification:received', (data) => {
      console.log('Notification:', data);
      // Handle notification
    });

    socket.on('customer:registered', (data) => {
      console.log('New customer registered:', data);
      // Update UI if needed (for admin panel)
    });

    socket.on('disconnect', () => {
      console.log('Socket disconnected');
    });
  }
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const getSocket = () => socket;
```

### **8. Use Socket in Your Component**
```javascript
import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { connectSocket, disconnectSocket } from '../services/socketService';

const Dashboard = () => {
  const { customer } = useAuth();

  useEffect(() => {
    if (customer?.id) {
      connectSocket(customer.id);
      return () => disconnectSocket();
    }
  }, [customer?.id]);

  return <div>Dashboard</div>;
};

export default Dashboard;
```

---

## 🛑 IMPORTANT NOTES

### **Data Stored in localStorage**
- `customerToken` - JWT token (expires in 30 days)
- `customer` - Customer object with id, username, email, full_name, phone, company_name

### **Token Format**
Every protected API request must include:
```
Authorization: Bearer <token>
```
(Axios interceptor in `api.js` handles this automatically)

### **API Response Format**
All responses follow this format:
```json
{
  "success": true/false,
  "message": "status message",
  "data": { /* actual data */ },
  "status": 200
}
```

### **Error Handling**
- If token is invalid/expired (401), user is automatically logged out
- Frontend should catch errors and display to user
- Check `error.response?.data?.message` for backend error message

### **CORS Configuration**
Backend allows requests from:
- `http://localhost:3000` (local customer frontend)
- `http://localhost:3001` (local admin frontend)

For production, update `.env` in backend:
```
CLIENT_URL=https://your-customer-domain.com
ADMIN_URL=https://your-admin-domain.com
```

---

## 🧪 TESTING CHECKLIST

- [ ] Backend running on port 5000
- [ ] Database has `customers` table
- [ ] Can register customer via POST `/api/auth/customer/register`
- [ ] Can login customer via POST `/api/auth/customer/login`
- [ ] Token is returned and stored
- [ ] Protected routes require valid token
- [ ] Frontend can call login endpoint and receive token
- [ ] Token is sent in Authorization header for protected requests
- [ ] Socket.io connections work (for real-time features)
- [ ] Profile update works with protected route

---

## 📊 API ENDPOINTS SUMMARY

| Method | Endpoint | Auth? | Description |
|--------|----------|-------|-------------|
| POST | `/api/auth/customer/register` | ❌ | Register new customer |
| POST | `/api/auth/customer/login` | ❌ | Login customer |
| GET | `/api/auth/customer/profile` | ✅ | Get customer profile |
| PUT | `/api/auth/customer/profile` | ✅ | Update customer profile |
| POST | `/api/auth/admin/register` | ❌ | Register admin (separate) |
| POST | `/api/auth/admin/login` | ❌ | Login admin (separate) |

---

## ⚡ Quick Start (After Setting Up Files Above)

1. **Start Backend**
   ```bash
   npm start
   ```

2. **Start Frontend**
   ```bash
   npm run dev
   ```

3. **Test Login**
   - Go to `http://localhost:3000/login`
   - Enter credentials
   - Should receive token and redirect to dashboard

4. **Debug**
   - Check browser DevTools → Application → localStorage for token
   - Check browser Console for errors
   - Check backend logs for API requests
   - Verify .env files are correct

---

## ❓ Troubleshooting

| Problem | Solution |
|---------|----------|
| "CORS error" | Ensure `CLIENT_URL=http://localhost:3000` in backend `.env` |
| "401 Unauthorized" | Token not sent correctly; check axios interceptor |
| "Cannot find module" | Run `npm install axios socket.io-client` |
| "Backend not responding" | Ensure backend running on port 5000 |
| "Token not persisting" | Check localStorage is being set; browser storage enabled |
| "Cannot read property 'id' of undefined" | Customer not loaded from context; check AuthProvider wrapper |

