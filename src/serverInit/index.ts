const api_version = '0.0.1';
import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import applyMiddleware from '../middleware';
import { formidable } from 'formidable';
import * as dotenv from 'dotenv'; 
import * as path from 'path';
import routeHandler from './router';
import swaggerHandler from './swagger';
import databaseHandler from './database';

const launch = async () => {
  try {
    await databaseHandler();
  } catch (e) {
    console.log(
      `Database init failed [env=${process.env.NODE_ENV}]`
    );
  }

  const controllers = await routeHandler();

  const app = await express();
  app.use(cors());
  app.use(express.json({ limit: '498mb' }));
  app.use(express.urlencoded({ limit: '498mb', extended: false }));

  app.use((req, res, next) => {
    res.header(
      'Access-Control-Allow-Methods',
      'GET, PUT, POST, PATCH, DELETE, HEAD, OPTIONS'
    );
    res.header('Access-Control-Allow-Origin', '*');
    next();
  });

  app.use('/public', express.static('public'));

  app.use((req: any, res: any, next: any) => {
    if (req.originalUrl !== '/file') {
      next();
      return;
    }

    const form = formidable({
      multiples: true,
      maxFileSize: 50 * 1024 * 1024,
    });

    form.parse(req, (err, fields, files) => {
      if (err) {
        console.log(err);
        next(err);
        return;
      }
      req.fields = fields || undefined;
      req.files = files || undefined;
      next();
    });
  });

  app.use(`/${api_version}`, controllers.router);
  if (
    process.env.NODE_ENV === 'development' ||
    process.env.NODE_ENV === undefined ||
    process.env.NODE_ENV === 'production'
  ) {
    console.log(`env=${process.env.NODE_ENV}`);
    const swagger = swaggerHandler(
      {
        host: process.env.SWAGGER_HOST || null,
        port: process.env.PORT || 3000,
        ...controllers,
      },
      api_version 
    );
    swagger.forEach((v) => {
      app.use(...v);
    });
  }

  app.use('/', (req, res) => {
    res.type('text/plain');
    res.status(200);
    res.send('service alive');
  });

  process.on('uncaughtException', (err) => {
    console.error("server dead uncaughtException");
    process.exit(1);
  });
  
  applyMiddleware(app);
  return { app };
};

export default { launch };