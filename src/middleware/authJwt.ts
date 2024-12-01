
import passport from 'passport';
import { ExtractJwt, Strategy as JwtStrategy } from 'passport-jwt';

export const SECRETORKEY: string = String(process.env.SECRET_KEY).trim(); 
const initAuthJwt = (app: any) => {
  passport.use(
    'jwt', 
    new JwtStrategy(
      {
        jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
        secretOrKey: SECRETORKEY,
      },
      (jwtPayload, done) => {
        console.log('[JWT Payload] ', jwtPayload);
        const { exp } = jwtPayload;
        if (Date.now() >= exp * 1000) {
          return done(null, { message: 'auth expired' });
        }
        done(
          null,
          { authToken: null, accessToken: null }, 
          { message: 'auth success' }
        );
      }
    )
  );

  app.use(passport.initialize({ userProperty: 'authJwt' }));
};

export default { initAuthJwt };
