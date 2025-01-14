const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const authRoutes = require('./routes/auth');
const logger = require('./logger');
const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const os = require('os');
const cors = require('cors');
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const HOST = '0.0.0.0';

// Obtener la dirección IP de la red local
const networkInterfaces = os.networkInterfaces();
const localIp = Object.values(networkInterfaces)
  .flat()
  .find((iface) => iface.family === 'IPv4' && !iface.internal).address;

const swaggerOptions = {
  swaggerDefinition: {
    openapi: '3.0.0',
    info: {
      title: 'Login Users API',
      version: '1.0.0',
      description: 'API for user login and JWT generation'
    },
    servers: [
      {
        url: `http://localhost:${PORT}`
      }
    ]
  },
  apis: ['./routes/*.js']
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

const corsOptions = {
  origin: 'http://192.168.137.1:3000',
  optionsSuccessStatus: 200
};

app.use(cors()); // Aceptar solicitudes desde cualquier origen
app.use(express.json());
app.use('/api/auth', authRoutes);

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  logger.info('Connected to MongoDB');
  app.listen(PORT, HOST, () => {
    //logger.info(`Server running on http://${localIp}:${PORT}`);
    logger.info(`Server running on http://localhost:${PORT}`);
  });
}).catch(err => {
  logger.error('MongoDB connection error:', err);
});
