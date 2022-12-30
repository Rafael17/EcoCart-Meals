const MAX_INGREDIENTS = 20;

export interface MealResponseDTO {
    meals: [];
}

interface IngredientItem {
    ingredient: string;
    measurement: string;
}

export class Meal {
    id: number;
    name: string;
    instructions: string;
    tags: string[];
    thumbUrl: string;
    youtubeUrl: string;
    ingredients: IngredientItem[];
    static toMeal(data: any): Meal {
        const meal = new Meal();
        meal.id = data.idMeal;
        meal.name = data.strMeal;
        meal.instructions = data.strInstructions;
        meal.tags = data.strTags ? data.strTags.split(',') : [];
        meal.thumbUrl = data.strMealThumb;
        meal.youtubeUrl = data.strYoutube;
        meal.ingredients = [];
        for (let i = 1; i <= MAX_INGREDIENTS; i++) {
            if (data[`strIngredient${i}`]) {
                const ingredient: IngredientItem = {
                    ingredient: data[`strIngredient${i}`],
                    measurement: data[`strMeasure${i}`],
                };
                meal.ingredients.push(ingredient);
            }
        }
        return meal;
    }
}
