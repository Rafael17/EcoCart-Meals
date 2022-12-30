import { NextFunction, Request, Response } from 'express';
import * as express from 'express';
import { AppError, HttpCode } from './middleware';
import { Meal, MealResponseDTO } from './meal';
import { CustomRequest } from './customRequest';

const router = express.Router();

type MealQueryParams = {
    main_ingredient: string;
};

const MEALDB_API_URL = 'https://www.themealdb.com/api/json/v1/1/';

router.get(
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
            const mealIds = await getAllMealIdsFromMainIngredient(
                req.query.main_ingredient,
            );
            if (!mealIds) {
                return res.status(200).json([]);
            }

            const promises = mealIds.map((mealId) => getMealById(mealId));
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
            const error: AppError = {
                httpCode: HttpCode.BAD_REQUEST,
                message: 'Error requesting data from MealDB',
            };
            next(error);
        }
    },
);

async function getAllMealIdsFromMainIngredient(mainIngridient: string) {
    const mainIngridientURL = `${MEALDB_API_URL}filter.php?i=${mainIngridient}`;
    const results = (await CustomRequest.get(
        mainIngridientURL,
    )) as MealResponseDTO;
    return results.meals
        ?.map((result) => Meal.toMeal(result))
        ?.map((meal) => meal.id);
}

async function getMealById(mealId: number) {
    const url = `${MEALDB_API_URL}lookup.php?i=${mealId}`;
    return new Promise(async (resolve, reject) => {
        try {
            const response = await CustomRequest.get(url);
            resolve(response);
        } catch (e) {
            reject(e);
        }
    });
}

export default router;
