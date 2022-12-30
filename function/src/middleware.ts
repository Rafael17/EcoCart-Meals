import { NextFunction, Request, Response } from 'express';
export enum HttpCode {
    OK = 200,
    BAD_REQUEST = 400,
    FORBIDDEN = 403,
    NOT_FOUND = 404,
    INTERNAL_SERVER_ERROR = 500,
}

export interface AppError {
    message: string;
    httpCode: HttpCode;
}

export const verifyToken = (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    const bearerHeader = req.headers.authorization;
    if (bearerHeader) {
        const bearer = bearerHeader.split(' ');
        const bearerToken = bearer.length > 1 ? bearer[1] : '';
        if (bearerToken === process.env.API_KEY) {
            return next();
        }
    }
    res.status(HttpCode.FORBIDDEN).send();
};

export const errorLogger = (
    err: AppError,
    _req: Request,
    _res: Response,
    next: NextFunction,
) => {
    console.error('\x1b[31m', err); // adding some color to our logs
    next(err);
};

export const errorResponder = (
    err: AppError,
    _req: Request,
    res: Response,
    _next: NextFunction,
) => {
    res.status(err.httpCode).json({ message: err.message });
};
export const invalidResource = (
    _req: Request,
    res: Response,
    _next: NextFunction,
) => {
    res.status(404).json({ message: 'The requested resource was not found' });
};
