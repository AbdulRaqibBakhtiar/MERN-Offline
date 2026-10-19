const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const connectDB = require('./config/db');
const { getJwtSecret } = require('./middleware/auth');
const { getAllowedOrigins } = require('./config/origins');
const { rateLimit } = require('./middleware/rateLimit');

const inventoryRoutes = require('./routes/inventory');
const authRoutes = require('./routes/auth');
const contentRoutes = require('./routes/content');
const metricsRoutes = require('./routes/metrics');
const softwareRoutes = require('./routes/software');
const chatRoutes = require("./routes/chat");
const articleRoutes = require('./routes/articles');

const app = express();
app.disable('x-powered-by');
if (process.env.TRUST_PROXY === 'true') app.set('trust proxy', 1);

const requiredFolders = [
  path.join(__dirname, 'public', 'uploads', 'products'),
  path.join(__dirname, 'public', 'uploads', 'news'),
  path.join(__dirname, 'public', 'uploads', 'ads'),
  path.join(__dirname, 'public', 'uploads', 'profiles'),
  path.join(__dirname, 'public', 'uploads', 'software')
];

requiredFolders.forEach(folderPath => {
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true });
    console.log(`📁 Auto-created asset storage path: ${folderPath}`);
  }
});

const allowedOrigins = getAllowedOrigins();
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('Origin is not allowed by this API.'));
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: false,
  maxAge: 600
}));
app.use((req, res, next) => {
  res.set({
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(self), microphone=(self), geolocation=()'
  });
  if (process.env.NODE_ENV === 'production' && req.secure) {
    res.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains');
  }
  next();
});
app.use('/auth', rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));
app.use('/auth/login', rateLimit({ windowMs: 15 * 60 * 1000, max: 10, message: 'Too many sign-in attempts. Please wait before trying again.' }));
app.use('/auth/register', rateLimit({ windowMs: 60 * 60 * 1000, max: 10 }));
app.use(express.json({ limit: '1mb' }));

const staticOptions = {
  dotfiles: 'deny',
  index: false,
  setHeaders: res => {
    res.set('Content-Security-Policy', "default-src 'none'; sandbox");
    res.set('Cross-Origin-Resource-Policy', 'cross-origin');
  }
};
app.use('/public', express.static(path.join(__dirname, 'public'), staticOptions));
app.use(express.static(path.join(__dirname, 'public'), staticOptions));
app.use("/chat", chatRoutes);

const runSchemaMigration = async () => {
  try {
    const Inventory = require('./models/Inventory');
    const itemsToUpdate = await Inventory.find({ $or: [ { condition: { $exists: false } }, { condition: "" } ] });
    
    if (itemsToUpdate.length === 0) {
      return;
    }
    
    for (let item of itemsToUpdate) {
      await Inventory.findByIdAndUpdate(item._id, { $set: {
        description: item.description || "",
        condition: item.condition || "New",
        warranty: item.warranty || "",
        specifications: {
          dimensions: item.specifications?.dimensions || "Standard Size",
          weight: item.specifications?.weight || "Lightweight Ergonomic Composition",
          powerSource: item.specifications?.powerSource || "Cordless / Lithium-Ion Battery System"
        }
      }}, { runValidators: false });
    }
  } catch (err) {
    console.error("❌ Schema migration broken:", err.message);
  }
};

app.get('/', (req, res) => res.send('Server is running successfully!'));
app.use('/inventory', inventoryRoutes);
app.use('/auth', authRoutes);
app.use('/content', contentRoutes);
app.use('/articles', articleRoutes);
app.use('/software', softwareRoutes);
app.use('/metrics', metricsRoutes);

app.use((error, req, res, next) => {
  if (res.headersSent) return next(error);
  if (error?.name === 'MulterError') {
    const status = error.code === 'LIMIT_FILE_SIZE' || error.code === 'LIMIT_FILE_COUNT' ? 413 : 400;
    return res.status(status).json({ error: status === 413 ? 'The upload exceeds the allowed size or file count.' : 'The uploaded file could not be accepted.' });
  }
  if (/^Only (images?|supported image)|^Avatar must be|^The uploaded file/i.test(error?.message || '')) {
    return res.status(400).json({ error: error.message });
  }
  if (error?.message === 'Origin is not allowed by this API.') return res.status(403).json({ error: error.message });
  console.error('Unhandled API error:', error?.message || error);
  return res.status(500).json({ error: 'An unexpected server error occurred.' });
});

const PORT = process.env.PORT || 5000;

const http = require('http');
const server = http.createServer(app);
const socketManager = require('./config/socket');

socketManager.init(server);

const start = async () => {
  try {
    if (process.env.NODE_ENV === 'production' && !allowedOrigins.length) {
      throw new Error('CORS_ORIGINS must list at least one trusted frontend origin in production.');
    }
    if (allowedOrigins.includes('*')) throw new Error('Wildcard CORS origins are not allowed.');
    getJwtSecret();
    if (!process.env.MONGO_URI) throw new Error('MONGO_URI must be configured.');
    await connectDB();
    await runSchemaMigration();
    const articleController = require('./controllers/articleController');
    await articleController.publishScheduledArticles();
    setInterval(() => articleController.publishScheduledArticles().catch(error => console.error('Scheduled article publishing failed:', error.message)), 60 * 1000);
    server.listen(PORT, "0.0.0.0", () => {
      console.log(`Real-time Server online on port ${PORT}`);
    });
  } catch (error) {
    console.error(`Server startup failed: ${error.message}`);
    process.exit(1);
  }
};

start();
