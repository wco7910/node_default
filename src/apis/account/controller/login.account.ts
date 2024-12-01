import { NextFunction, Request, Response } from 'express';
import { AccountService } from '../service/s.account';
export const tags = ['Account'];
export const summary = 'login';

export const request = {
  path: '/account/signin',
  method: 'post',
};

export const dto = 'login';

export const params = {
  path: {},
  query: {},
  body: {
    email: {
      type: 'string',
    },
    password: {
      type: 'string',
    },
    firebaseToken: {
      type: 'string',
    },
    ipAddress: {
      type: 'string',
    },
  },
  form: {},
};

export const security = ['ANY'];

export const execute = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await AccountService.logIn(
      req.body.email,
      req.body.password,
      req.body.firebaseToken,
      req.body.ipAddress
    );
    if (result[0] == null) {
      throw Error;
    }

    return res.json({
      version: process.env?.API_VERSION,
      message: 'OK',
      payload: {
        access_token: result[0],
        refresh_token: result[1],
        expired_at: result[2],
        accountId: result[3],
        centerId: result[4],
        type: 'Bearer',
      },
    });
  } catch (err) {
    if (err.message == 'unauthorized user') {
      return res.json({
        version: process.env?.API_VERSION,
        message: 'SUSPENDED_ACCOUNT',
        code: 403,
        error: {
          code: 403,
          message: '활동이 정지된 계정입니다.',
        },
      });
    }
    return res.json({
      version: process.env?.API_VERSION,
      message: 'USER_NOT_FOUND',
      code: 404,
      error: {
        code: 404,
        message: '로그인에 실패했습니다.',
      },
    });
  }
};

export default execute;
