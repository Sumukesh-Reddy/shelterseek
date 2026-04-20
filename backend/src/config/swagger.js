const swaggerJSDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const path = require('path');

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'ShelterSeek API',
    version: '1.0.0',
    description: 'API documentation for ShelterSeek backend services.',
    contact: {
      name: 'ShelterSeek Support',
      url: 'http://localhost:3000',
    },
  },
  servers: [
    {
      url: 'http://localhost:3001',
      description: 'Development server',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
  },
  security: [
    {
      bearerAuth: [],
    },
  ],
};

const options = {
  swaggerDefinition,
  apis: [
    path.join(__dirname, '../routes/*.js'), 
    path.join(__dirname, '../models/*.js'),
    path.join(__dirname, '../app.js')
  ],
};

const swaggerSpec = swaggerJSDoc(options);

const setupSwagger = (app) => {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  console.log('📄 Swagger docs available at /api-docs');
};

module.exports = setupSwagger;