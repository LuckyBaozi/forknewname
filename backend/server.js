const express = require('express');
const path = require('path');
const { getDB, initDB, seedIfEmpty, startAutoSave } = require('./db/database');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes (must mount before static middleware)
app.use('/api', require('./routes/api'));
app.use('/admin/api', require('./routes/admin'));

// Serve admin static files
app.use('/admin', express.static(path.join(__dirname, 'admin')));

// 404
app.use((_req, res) => {
  res.status(404).json({ code: -1, message: 'Not Found' });
});

// Error handler
app.use(errorHandler);

// Boot: init DB then start server
async function boot() {
  try {
    const database = await getDB();
    initDB(database);
    seedIfEmpty(database);
    startAutoSave();

    app.listen(PORT, () => {
      console.log(`[Server] 起名小程序后端运行在 http://localhost:${PORT}`);
      console.log(`[Server] 管理页面: http://localhost:${PORT}/admin`);
    });
  } catch (err) {
    console.error('[Boot] Failed to start:', err);
    process.exit(1);
  }
}

boot();
