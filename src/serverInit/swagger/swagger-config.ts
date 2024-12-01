const swaggerCfg = {
  openapi: '3.0.1',
  info: {
    title: 'api',
    version: '0.0.1',
    description: '',
  },
  servers: [],
  security: [],
  paths: {},
  tags: [],
  externalDocs: [],
  components: {
    schemas: {},
    securitySchemes: {
      bearerAuth: {
        type: 'oauth2',
        flows: {
          password: {
          },
        },
      },
    },
  },
};

export default swaggerCfg;
