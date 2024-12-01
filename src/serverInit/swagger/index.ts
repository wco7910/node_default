import express from 'express';
import swaggerUi from 'swagger-ui-express';
import swg from './swagger-config';

const methods = ['get', 'post', 'put', 'patch', 'delete'];
// ------------------------------------------------------------------------------
const swaggerHandler = ({ host, port, pages, schemas }, prefix?: string) => {
  // swagger config
  let swagger: any = {
    ...swg,
  };

  Object.keys(schemas).map((key) => {
    swagger.components.schemas[key] = schemas[key];
  });

  pages?.sort((a, b) => {
    const ix1 = methods.indexOf(a.method?.toLowerCase());
    const ix2 = methods.indexOf(b.method?.toLowerCase());
    return a.data?.tags?.[0] > b.data?.tags?.[0]
      ? 1
      : a.data?.tags?.[0] < b.data?.tags?.[0]
      ? -1
      : a.path > b.path
      ? 1
      : a.path < b.path
      ? -1
      : ix1 > ix2
      ? 1
      : ix1 < ix2
      ? -1
      : 0;
  });

  pages?.forEach((v: any) => {
    if (!v.data?.tags || !v.data?.summary) return;
    let resultData: any = undefined;
    if (v?.dto_name) {
      resultData = { $ref: '#/components/schemas/' + v?.dto_name };
    }

    if (!swagger.paths[v.path]) swagger.paths[v.path] = {};
    swagger.paths[v.path][v.method?.toLowerCase()] = {
      ...v.data,
      tags: v.data.tags || [],
      responses: {
        200: {
          description: 'OK',
          content: !resultData
            ? undefined
            : {
                'application/json': { schema: resultData },
              },
        },
        400: {
          description: 'Parameter Error',
        },
        401: {
          description: 'Authorized Error',
        },
        404: {
          description: 'Not found data',
        },
        405: {
          description: 'Invalid input',
        },
      },
    };
  });

  return [
    [
      '/swagger-ui',
      swaggerUi.serve,
      swaggerUi.setup(undefined, {
        swaggerOptions: {
        url: `${
          host || 'https://v1api.humanb.kr/'
        }api-docs`,
        docExpansion: 'none',
      },
      }),
    ],
    [
      '/api-docs',
      (req: express.Request, res: express.Response) => {
        swagger.servers = [
          {
            url: `${host || 'https://v1api.humanb.kr/'}${
              prefix ? `${prefix}` : ''
            }`,
          },
        ];
        return res.status(200).json(swagger);
      },
    ],
  ];
};

export default swaggerHandler;
