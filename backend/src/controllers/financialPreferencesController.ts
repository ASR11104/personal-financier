import { Request, Response, NextFunction } from 'express';
import { db } from '../database/connection';
import { AppError } from '../middleware/errorHandler';

const handleError = (next: NextFunction, error: unknown): void => {
    if (error instanceof AppError) {
        next(error);
    } else {
        next(new AppError('Internal server error', 500));
    }
};

const DEFAULTS = {
    expected_retirement_age: 60,
    monthly_retirement_expense: null,
    expected_annual_return: 8.00,
    expected_inflation_rate: 6.00,
    life_expectancy: 80,
};

// Get user's financial preferences (or defaults)
export const getPreferences = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const authReq = req as any;
        const userId = authReq.user?.id;

        let preferences = await db('financial_preferences')
            .where('user_id', userId)
            .first();

        if (!preferences) {
            preferences = { ...DEFAULTS, user_id: userId };
        }

        res.json({ preferences });
    } catch (error) {
        handleError(next, error);
    }
};

// Create or update financial preferences
export const upsertPreferences = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const authReq = req as any;
        const userId = authReq.user?.id;
        const {
            expected_retirement_age,
            monthly_retirement_expense,
            expected_annual_return,
            expected_inflation_rate,
            life_expectancy,
        } = req.body;

        const existing = await db('financial_preferences')
            .where('user_id', userId)
            .first();

        const data = {
            expected_retirement_age: expected_retirement_age ?? DEFAULTS.expected_retirement_age,
            monthly_retirement_expense: monthly_retirement_expense ?? DEFAULTS.monthly_retirement_expense,
            expected_annual_return: expected_annual_return ?? DEFAULTS.expected_annual_return,
            expected_inflation_rate: expected_inflation_rate ?? DEFAULTS.expected_inflation_rate,
            life_expectancy: life_expectancy ?? DEFAULTS.life_expectancy,
            updated_at: db.fn.now(),
        };

        let preferences;

        if (existing) {
            [preferences] = await db('financial_preferences')
                .where('user_id', userId)
                .update(data)
                .returning('*');
        } else {
            [preferences] = await db('financial_preferences')
                .insert({ ...data, user_id: userId })
                .returning('*');
        }

        res.json({ preferences });
    } catch (error) {
        handleError(next, error);
    }
};
