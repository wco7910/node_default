import { Router } from 'express';
import authJwt from './authJwt';

const applyMiddleware = (router: Router) => {
    authJwt.initAuthJwt(router);
};

export default applyMiddleware;
