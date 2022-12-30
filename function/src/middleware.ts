export enum HttpCode {
    OK = 200,
    BAD_REQUEST = 400,
    UNAUTHORIZED = 401,
    NOT_FOUND = 404,
    INTERNAL_SERVER_ERROR = 500,
}

export interface AppError {
    message: string;
    httpCode: HttpCode;
}

export const errorLogger = (err: any, req: any, res: any, next: any) => {
    console.error('\x1b[31m', err); // adding some color to our logs
    next(err);
};

export const errorResponder = (
    err: AppError,
    req: any,
    res: any,
    next: any,
) => {
    res.status(err.httpCode).json({ message: err.message });
};
export const invalidResource = (req: any, res: any, next: any) => {
    res.status(404).json({ message: 'The requested resource was not found' });
};
