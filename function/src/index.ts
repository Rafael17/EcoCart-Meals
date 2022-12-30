import { NextFunction, Request, Response } from 'express';
import * as express from 'express';
import * as serverless from 'serverless-http';
import * as https from 'https';
import {
    AppError,
    errorLogger,
    errorResponder,
    HttpCode,
    invalidResource,
} from './middleware';
import { Meal, MealResponseDTO } from './meal';
import * as dotenv from 'dotenv';

dotenv.config();

const app = express();

const verifyToken = (req: Request, res: Response, next: NextFunction) => {
    const bearerHeader = req.headers.authorization;
    if (bearerHeader) {
        const bearer = bearerHeader.split(' ');
        const bearerToken = bearer.length > 1 ? bearer[1] : '';
        if (bearerToken === process.env.API_KEY) {
            return next();
        }
    }
    res.status(403).send();
};

app.use(verifyToken);

const MEALDB_API_URL = 'https://www.themealdb.com/api/json/v1/1/';

type MealQueryParams = {
    main_ingredient: string;
};

function getRequest(url: string) {
    return new Promise((resolve, reject) => {
        const req = https.get(url, (res) => {
            let rawData = '';
            res.on('data', (chunk) => {
                rawData += chunk;
            });

            res.on('end', () => {
                resolve(JSON.parse(rawData));
            });
        });

        req.on('error', (err: Error) => {
            reject(err);
        });
    });
}

app.get(
    '/meals',
    async (
        req: Request<{}, {}, {}, MealQueryParams>,
        res: Response,
        next: NextFunction,
    ) => {
        req.headers.authorization;
        if (!req.query.main_ingredient) {
            const error: AppError = {
                httpCode: HttpCode.BAD_REQUEST,
                message: 'Missing required query param main_ingredient',
            };
            return next(error);
        }
        try {
            const mainIngridient = req.query.main_ingredient;
            const mainIngridientURL = `${MEALDB_API_URL}filter.php?i=${mainIngridient}`;
            const results = (await getRequest(
                mainIngridientURL,
            )) as MealResponseDTO;
            const mealIds = results.meals
                .map((result) => Meal.toMeal(result))
                .map((meal) => meal.id);

            const promises = mealIds.map((mealIds) => {
                const url = `${MEALDB_API_URL}lookup.php?i=${mealIds}`;
                return new Promise(async (resolve, reject) => {
                    try {
                        const response = await getRequest(url);
                        resolve(response);
                    } catch (e) {
                        reject(e);
                    }
                });
            });
            const promiseResults = (await Promise.all(
                promises,
            )) as MealResponseDTO[];
            const meals = promiseResults
                .map((promiseResult) =>
                    promiseResult.meals.map((result) => Meal.toMeal(result)),
                )
                .reduce((acc, curVal) => {
                    return acc.concat(curVal);
                }, []);

            res.status(200).json(meals);
        } catch (e) {
            console.log(e);
            const error: AppError = {
                httpCode: HttpCode.BAD_REQUEST,
                message: 'Error requesting data from MealDB',
            };
            next(error);
        }
    },
);

app.use(errorLogger);
app.use(errorResponder);
app.use(invalidResource);

//exports.handler = serverless(app);
app.listen(3000);
