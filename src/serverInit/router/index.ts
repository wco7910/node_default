/*
Dependency Swagger 3.0 Rule
*/
import * as fs from 'fs';
import express, { json } from 'express';
import jwt from 'jsonwebtoken';
import passport from 'passport';
import path from 'path';

import _ from 'lodash';
import crypto from 'crypto-js';
export const MD5 = (contents: string) => crypto.MD5(contents);
import rbac from './rbac';
import { logger } from '#/middleware/logger';

const route_path = 'apis';

const cookieExtractor = (req) => {
  var token = null;
  if (req && req.cookies) {
    token = req.cookies['jwt'];
  }
  return token;
};

const fixParam = (args, source) => {
  if (!source || !args) return source;
  const items = _.pick(source, Object.keys(args));
  return Object.keys(items).reduce((p, v) => {
    if (items[v] === undefined || items[v] === null) {
      p[v] = undefined;
    } else if (args[v].type === 'number') {
      p[v] = parseInt(String(items[v]).replace(/[^0-9\.]+/, ''), 10);
    } else {
      p[v] = items[v];
    }
    return p;
  }, {});
};

const routeHandler = async () => {
  const router = express.Router();

  router.use(function (req, res, next) {
    res.header(
      'Access-Control-Allow-Methods',
      'GET, PUT, POST, DELETE, PATCH, HEAD, OPTIONS'
    );
    res.header('Access-Control-Allow-Origin', '*');
    next();
  });

  router.all('/*', function (req, res, next) {
    res.header(
      'Access-Control-Allow-Methods',
      'GET, PUT, POST, DELETE, PATCH, HEAD, OPTIONS'
    );
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'X-Requested-With');
    next();
  });

  const pages = [];
  const schemas = {};
  const loadFiles = [];

  const loadController = async (path, subPath, isCtrl) => {
    const files = await fs.readdirSync(path + subPath, { withFileTypes: true });
    for (const file of files) {
      if (file.isDirectory()) {
        await loadController(
          path,
          subPath + '/' + file.name,
          file.name === 'controller'
        );
      } else if (isCtrl && file.name.match(/\.(js|ts)$/) !== null) {
        const exec = await import(
          `../../${route_path}` + subPath + '/' + file.name
        );
        loadFiles.push({
          subPath,
          file,
          exec: exec,
          size: Object.keys(exec.params?.path || {}).length || 0,
        });
      }
    }
  };

  await loadController(`/dist/${route_path}`, '', false);
  loadFiles.sort((a: any, b: any) =>
    a.size > b.size ? 1 : a.size < b.size ? -1 : 0
  );

  for (const obj of loadFiles) {
    const { subPath, file } = obj;
    let exec: any = {
      ...obj?.exec,
      security: obj.exec?.security || ['ANY'],
    };

    let pageName = '/' + file.name.substring(0, file.name.length - 3);
    if (pageName === '/index') pageName = '';

    const parameters: any = [];

    const path: string = exec.request?.path || subPath + pageName;
    const method: string = exec.request?.method || 'get';
    const params: any = exec.params || {};
    const dto_name: string = exec?.dto || ''; 

    const content_type: any = params?.is_form_data
      ? ['multipart/form-data']
      : ['application/json'];

    let requestBody: any =
      dto_name.length > 0
        ? {
            description:
              `path :: ${subPath + '/' + file.name}\n` +
              (exec.description || ''),
            content: {
              [`${content_type}`]: {
                schema: {
                  $ref: '#/components/schemas/' + dto_name,
                },
              },
            },
          }
        : {};

    Object.keys(params.path || {}).forEach((key) => {
      parameters.push({
        name: key,
        in: 'path',
        required: true,
        ...params.path[key],
      });
    });

    Object.keys(params.query || {}).forEach((key) => {
      parameters.push({
        name: key,
        in: 'query',
        ...params.path[key],
        ...params.query[key],
      });
    });

    if (params?.is_form_data && Object.keys(params.body || {}).length > 0) {
      const schema_key = dto_name;
      schemas[schema_key] = {
        type: 'object',
        properties: params?.body,
      };

      requestBody = {
        description: requestBody?.description || '',
        content: {
          'multipart/form-data': {
            schema: {
              $ref: '#/components/schemas/' + schema_key,
            },
          },
        },
      };
    } else if (Array.isArray(params?.body) && params?.body?.length > 0) {
      const schema_key = dto_name;
      schemas[schema_key] = {
        type: 'array',
        items: {
          type: 'object',
          properties: params?.body[0],
        },
      };
      parameters.push({
        name: 'body',
        in: 'body',
        schema: {
          $ref: '#/components/schemas/' + schema_key,
        },
      });
    } else if (Object.keys(params?.body || {}).length > 0) {
      const schema_key = dto_name;
      schemas[schema_key] = {
        type: 'object',
        properties: params?.body,
      };
      parameters.push({
        name: 'body',
        in: 'body',
        schema: {
          $ref: '#/components/schemas/' + schema_key,
        },
      });
    }

    let security = [];
    if (
      exec?.security &&
      exec?.security.length > 0 &&
      !exec.security.includes('ANY')
    ) {
      security = [
        {
          bearerAuth: [], 
        },
      ];
    }

    if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'production') {
      pages.push({
        path,
        method,
        dto_name,
        content_type,
        data: {
          tags: exec.tags,
          summary: exec.summary,
          security,
          description:
            `path :: ${subPath + '/' + file.name}\n` + (exec.description || ''),
          operationId: method + ':' + path,
          parameters,
          requestBody,
        },
      });
    }

    const route_uri = path.replace(/\{([a-zA-Z0-9\_]+)\}/g, ':$1');

    router[method](
      route_uri,
      async (req, res, next) => {
        req.startTime = new Date().getTime();
        if (exec.security.includes('ANY')) {
          return next();
        }

        req.user = undefined;
        const authorization = req.headers?.authorization;
        try {
          await passport.authenticate(
            'jwt',
            { session: false },
            (err, user) => {
              req.user = user || undefined;

              if (!err && !user) {
                let decoded;
                try {
                  authorization;
                  const token = authorization.replace(/^Bearer /i, '');
                  decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
                } catch (err) {
                  if (err.message === 'jwt expired') {
                    console.log('[JWT error] expired token');
                    throw err;
                  } else if (err.message === 'invalid token') {
                    console.log('[JWT error] invalid token');
                    throw err;
                  } else {
                    console.log('[JWT error] unknown token');
                    throw err;
                  }
                }
                req.user =
                  (decoded && {
                    id: decoded?.id,
                    username: decoded?.username,
                    role: decoded?.role,
                    center: decoded?.center,
                    centerName: decoded?.centerName,
                    ip: decoded?.ip,
                  }) ||
                  undefined;
              }
              next();
            }
          )(req, res, next);
        } catch (err) {
          console.log('[JWT error] ', err);
          return res.json({
            code: 40300,
            error: err.message,
            message: 'TOKEN_EXPIRED',
          });
        }
      },

      async (req, res, next) => {
        if (!exec.execute) {
          res.status(404).json({});
        } else {
          console.log(req?.route?.path + ' / ' + req?.user?.centerName);
          await logger({
            user: req?.user,
            path: req?.route?.path,
            method: req?.method,
          });
          try {
            if (
              exec.security &&
              exec.security.length > 0 &&
              !exec.security.includes('ANY')
            ) {
              let success: boolean = false;
              if (req?.user?.username) {
                success = rbac({ role: req?.user?.role, path: req?.path });
              }
              
              if (!success) {
                throw {
                  status: 401,
                  message: 'Required Permissions.',
                  data: exec.security,
                };
              }
            }
            // -----------------------------------------------------------------------------------
            const args = {
              params: {
                ...req.params,
                ...req?.body,
                ...req.query,
              },
              files: req.files,
              body: fixParam(exec.params?.body, req?.body),
              query: fixParam(exec.params.query, req.query),
              path: fixParam(exec.params.path, req.params),
              user: req.user,
            };
            const params = args.params;
            // -----------------------------------------------------------------------------------
            // Business
            if (exec.execute.length >= 3) {
              return await exec.execute(req, res, next, { params });
            } else {
              const output = await exec.execute(args); //({ ...args, user: req.user });
              res.status(200).json(output);
            }
          } catch (e) {
            if (e?.status === 301) {
              res.redirect(301, e.location);
            } else if (e?.status) {
              res
                .status(e?.status)
                .json({ message: e?.message, data: e?.data });
            } else {
              if (!e?.status) {
                // console.warn('>>> ', route_uri);
                console.warn(e);
              }
              res.status(e?.status || 500).json({
                uri: route_uri,
                message: e?.message,
                data: e?.data || JSON.stringify(e),
              });
            }
          }
        }
      }
    );
  }

  router.use((req, res) => {
    let url = req.protocol + '://' + req.get('host') + req.originalUrl;
    res.type('text/plain');
    res.status(404);
    res.send('404 - Not Found');
  });

  return { router, pages, schemas };
};

export default routeHandler;
