
import { CreateAccountDto } from '../dto/create.account.dto';
import { accountRepository } from '../repository/r.account';
import { randomBytes, scrypt as _scrpyt } from 'crypto';
import { promisify } from 'util';
import { Account } from '../entity/e.account';
import jwt from 'jsonwebtoken';

const scrypt = promisify(_scrpyt);

export const AccountService = {
  logIn: async (
    email: string,
    password: string,
    firebaseToken: string,
    ipAddress: string
  ) => {
    const user = await accountRepository
      .createQueryBuilder('account')
      .leftJoinAndSelect('account.center', 'center')
      .where('account.email =:email', { email: email })
      .addSelect('account.password')
      .getOne();
    if (!user) {
      throw new Error('user not found!');
    }
    if ((await AccountService.suspendCheck(user.id)) == false) {
      throw new Error('unauthorized user');
    }

    const [salt, storedhash] = user.password.split('.');

    const hash = (await scrypt(password, salt, 32)) as Buffer;

    if (storedhash !== hash.toString('hex')) {
      log.content = '비밀번호 불일치';
      throw new Error('bad password');
    }

    const [access_token, refresh_token, expired_at] =
      await AccountService.jwtAssign(user, ipAddress);

    await accountRepository.update(user.id, {
      firebaseToken: firebaseToken,
      refreshToken: refresh_token,
    });

    return [access_token, refresh_token, expired_at, user.id, user.center.id];
  },
  jwtAssign: async (account: Account, ipAddress: string) => {
    const expired_at = Math.floor((Date.now() + parseInt('600') * 1000) / 1000);

    const access_token: string = await jwt.sign(
      {
        id: account.id,
        username: account.name,
        role: account.role,
        center: account?.centerId,
        centerName: account?.center?.name,
        ip: ipAddress,
      },
      process.env.JWT_SECRET_KEY,
      {
        expiresIn: '10m',
      }
    );
    const refresh_token: string = await jwt.sign(
      {
        id: account.id,
        username: account.name,
        role: account.role,
        center: account?.centerId,
        centerName: account?.center?.name,
        ip: ipAddress,
      },
      process.env.JWT_SECRET_KEY,
      {
        expiresIn: '30d',
      }
    );
    return [access_token, refresh_token, String(expired_at)];
  },

};
