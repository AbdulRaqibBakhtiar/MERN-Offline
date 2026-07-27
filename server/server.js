const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();
const connectDB = require('./config/db');

const inventoryRoutes = require('./routes/inventory');
const authRoutes = require('./routes/auth');
const contentRoutes = require('./routes/content');
const metricsRoutes = require('./routes/metrics');
const softwareRoutes = require('./routes/software');
const chatRoutes = require("./routes/chat");

const app = express();

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

app.use(cors());
app.use(express.json());

app.use('/public', express.static(path.join(__dirname, 'public'), {
  setHeaders: (res) => {
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  }
}));

app.use(express.static(path.join(__dirname, 'public')));
app.use("/chat", chatRoutes);

connectDB();

const runSchemaMigration = async () => {
  try {
    const Inventory = require('./models/Inventory');
    console.log("⚙️ Checking database products for missing commercial fields...");
    const itemsToUpdate = await Inventory.find({ $or: [ { condition: { $exists: false } }, { condition: "" } ] });
    
    if (itemsToUpdate.length === 0) {
      return;
    }
    
    for (let item of itemsToUpdate) {
      await Inventory.findByIdAndUpdate(item._id, { $set: {
        description: item.description || "Professional-grade industrial hardware tool designed for structural precision and heavy-duty deployment.",
        condition: item.condition || "Brand New / Factory Sealed",
        warranty: item.warranty || "1-Year Manufacturer Warranty Protection Included",
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
setTimeout(runSchemaMigration, 3000);

app.get('/', (req, res) => res.send('Server is running successfully!'));
app.use('/inventory', inventoryRoutes);
app.use('/auth', authRoutes);
app.use('/content', contentRoutes);
app.use('/software', softwareRoutes);
app.use('/metrics', metricsRoutes);

const PORT = process.env.PORT || 5000;

const http = require('http');
const server = http.createServer(app);
const socketManager = require('./config/socket');

socketManager.init(server);

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Real-time Server online globally on port ${PORT}`);
});
