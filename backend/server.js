import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { createPool } from 'mysql2/promise';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

// Load environment variables
dotenv.config();

const app = express();
const server = http.createServer(app);

// Configure CORS with environment variable
const corsOrigin = process.env.CORS_ORIGIN || 'http://10.10.1.25';

// Configure CORS
app.use(cors({
  origin: corsOrigin,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cache-Control', 'Accept'],
  credentials: true,
  optionsSuccessStatus: 204
}));

app.use(express.json());

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Configure Socket.IO with CORS
const io = new Server(server, {
  cors: {
    origin: corsOrigin,
    methods: ['GET', 'POST'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'Cache-Control', 'Accept']
  },
  transports: ['websocket', 'polling'],
  pingTimeout: 60000,
  pingInterval: 25000,
  allowEIO3: true,
  maxHttpBufferSize: 1e8
});

// Create MySQL connection pool with retry mechanism
const createPoolWithRetry = async (retries = 5, delay = 5000) => {
  for (let i = 0; i < retries; i++) {
    try {
      const pool = createPool({
        host: process.env.MYSQL_HOST || '10.10.11.27',
        user: process.env.MYSQL_USER || 'root',
        password: process.env.MYSQL_PASSWORD || 'bismillah123',
        database: process.env.MYSQL_DATABASE || 'suhu',
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        enableKeepAlive: true,
        keepAliveInitialDelay: 0,
        timezone: '+07:00',
        dateStrings: true
      });

      // Test the connection
      const connection = await pool.getConnection();
      connection.release();
      console.log('Database connection successful');
      return pool;
    } catch (error) {
      console.error(`Database connection attempt ${i + 1} failed:`, error.message);
      if (i < retries - 1) {
        console.log(`Retrying in ${delay/1000} seconds...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  throw new Error('Failed to connect to database after multiple attempts');
};

// Create a separate pool for access logs
const createAccessLogsPool = async () => {
  return createPool({
    host: '10.10.11.27',
    user: 'root',
    password: 'bismillah123',
    database: 'rfid_access_control',
    waitForConnections: true,
    connectionLimit: 5,
    queueLimit: 0,
    timezone: '+07:00',
    dateStrings: true
  });
};

let pool;
let accessLogsPool;

Promise.all([createPoolWithRetry(), createAccessLogsPool()])
  .then(([mainPool, logsPool]) => {
    pool = mainPool;
    accessLogsPool = logsPool;
    console.log('All database connections established successfully');
  })
  .catch(error => {
    console.error('Fatal database connection error:', error);
    process.exit(1);
  });

// Check database connection
async function checkDatabaseConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('Database connection successful');
    connection.release();
    return true;
  } catch (error) {
    console.error('Database connection failed:', error.message);
    return false;
  }
}

// Login endpoint
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    const [users] = await pool.query(
      'SELECT * FROM users WHERE username = ?',
      [username]
    );

    if (users.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = users[0];
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user.id, username: user.username },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ token });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// Protected routes
app.use('/api/protected', authenticateToken);

// API routes
app.get('/', (req, res) => {
  res.send('NOC Monitoring Backend is running');
});

app.get('/api/health', async (req, res) => {
  const dbConnected = await checkDatabaseConnection();
  res.json({
    status: 'ok',
    database: dbConnected ? 'connected' : 'disconnected'
  });
});

// Access logs endpoint with error handling and retries
app.get('/api/access-logs', async (req, res) => {
  let retries = 3;
  while (retries > 0) {
    try {
      const [rows] = await accessLogsPool.query(`
        SELECT 
          al.access_time,
          al.access_granted,
          u.username,
          d.door_name
        FROM access_logs al
        LEFT JOIN users u ON al.user_id = u.user_id
        LEFT JOIN doors d ON al.door_id = d.door_id
        ORDER BY al.access_time DESC 
        LIMIT 5
      `);
      return res.json(rows);
    } catch (error) {
      console.error(`Error fetching access logs (attempt ${4 - retries}):`, error);
      retries--;
      if (retries === 0) {
        return res.status(500).json({ 
          error: 'Failed to fetch access logs',
          details: error.message 
        });
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
});

// Fetch and emit data every 5 seconds
async function fetchAndEmitData() {
  try {
    // Fetch NOC temperature and humidity data
    const [nocData] = await pool.query('SELECT * FROM sensor_data ORDER BY id DESC LIMIT 1');
    if (nocData.length > 0) {
      io.emit('noc_temperature', { 
        suhu: parseFloat(nocData[0].suhu),
        waktu: nocData[0].waktu
      });
      
      io.emit('noc_humidity', { 
        kelembapan: parseFloat(nocData[0].kelembapan),
        waktu: nocData[0].waktu
      });
    }

    // Fetch UPS temperature and humidity data
    const [upsData] = await pool.query('SELECT * FROM sensor_data1 ORDER BY id DESC LIMIT 1');
    if (upsData.length > 0) {
      io.emit('ups_temperature', { 
        suhu: parseFloat(upsData[0].suhu),
        waktu: upsData[0].waktu
      });
      
      io.emit('ups_humidity', { 
        kelembapan: parseFloat(upsData[0].kelembapan),
        waktu: upsData[0].waktu
      });
    }

    // Fetch electrical data
    const [electricalData] = await pool.query('SELECT * FROM listrik_noc ORDER BY id DESC LIMIT 1');
    if (electricalData.length > 0) {
      io.emit('electrical_data', electricalData[0]);
    }

    // Fetch fire and smoke detection data
    const [fireSmokeData] = await pool.query('SELECT * FROM api_asap_data ORDER BY id DESC LIMIT 1');
    if (fireSmokeData.length > 0) {
      io.emit('fire_smoke_data', fireSmokeData[0]);
    }

    // Fetch access logs from rfid_access_control database with user and door info
    const [accessLogs] = await accessLogsPool.query(`
      SELECT 
        al.access_time,
        al.access_granted,
        u.username,
        d.door_name
      FROM access_logs al
      LEFT JOIN users u ON al.user_id = u.user_id
      LEFT JOIN doors d ON al.door_id = d.door_id
      ORDER BY al.access_time DESC 
      LIMIT 5
    `);
    if (accessLogs.length > 0) {
      io.emit('access_logs', accessLogs);
    }

  } catch (error) {
    console.error('Error fetching or emitting data:', error);
  }
}

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('Client connected');
  
  socket.on('disconnect', (reason) => {
    console.log('Client disconnected:', reason);
  });

  socket.on('error', (error) => {
    console.error('Socket error:', error);
  });
});

// Start data emission interval
setInterval(fetchAndEmitData, 5000);

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  checkDatabaseConnection();
});