const app = require('./src/app');
const config = require('./src/config/env');
const { testConnection } = require('./src/config/database');

const startServer = async () => {
  try {
    const dbConnected = await testConnection();
    
    if (!dbConnected) {
      console.log('⚠ Warning: Database connection failed. Server will start but database operations may fail.');
    }

    const server = app.listen(config.server.port, () => {
      console.log('='.repeat(50));
      console.log('✓ Custom Blog System API Server');
      console.log(`✓ Environment: ${config.server.env}`);
      console.log(`✓ Server running on port: ${config.server.port}`);
      console.log(`✓ URL: http://localhost:${config.server.port}`);
      console.log('='.repeat(50));
    });

    process.on('SIGTERM', () => {
      console.log('SIGTERM signal received: closing HTTP server');
      server.close(() => {
        console.log('HTTP server closed');
      });
    });

    process.on('SIGINT', () => {
      console.log('SIGINT signal received: closing HTTP server');
      server.close(() => {
        console.log('HTTP server closed');
        process.exit(0);
      });
    });

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
