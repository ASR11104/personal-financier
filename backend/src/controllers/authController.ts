import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../database/connection';
import { config } from '../config';
import { AppError } from '../middleware/errorHandler';

export const register = async (req: Request, res: Response): Promise<void> => {
  const { email, password, first_name, last_name } = req.body;

  const existingUser = await db('users')
    .whereRaw('LOWER(email) = LOWER(?)', [email])
    .first();

  if (existingUser) {
    throw new AppError('Email already registered', 400);
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const [user] = await db('users')
    .insert({
      email,
      password_hash: passwordHash,
      first_name,
      last_name,
    })
    .returning('*');

  const token = jwt.sign(
    { id: user.id, email: user.email },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  );

  const refreshToken = jwt.sign(
    { id: user.id, email: user.email },
    config.jwt.refreshSecret,
    { expiresIn: config.jwt.refreshExpiresIn }
  );

  res.status(201).json({
    user: {
      id: user.id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
    },
    token,
    refreshToken,
  });
};

export const login = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  const user = await db('users')
    .whereRaw('LOWER(email) = LOWER(?)', [email])
    .first();

  if (!user) {
    throw new AppError('Invalid credentials', 401);
  }

  const isValidPassword = await bcrypt.compare(password, user.password_hash);

  if (!isValidPassword) {
    throw new AppError('Invalid credentials', 401);
  }

  const token = jwt.sign(
    { id: user.id, email: user.email },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  );

  const refreshToken = jwt.sign(
    { id: user.id, email: user.email },
    config.jwt.refreshSecret,
    { expiresIn: config.jwt.refreshExpiresIn }
  );

  res.json({
    user: {
      id: user.id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
    },
    token,
    refreshToken,
  });
};

export const refreshToken = async (req: Request, res: Response): Promise<void> => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    throw new AppError('Refresh token required', 400);
  }

  try {
    const decoded = jwt.verify(refreshToken, config.jwt.refreshSecret) as {
      id: string;
      email: string;
    };

    const user = await db('users').where('id', decoded.id).first();

    if (!user) {
      throw new AppError('User not found', 404);
    }

    const newToken = jwt.sign(
      { id: user.id, email: user.email },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );

    res.json({ token: newToken });
  } catch (error) {
    throw new AppError('Invalid refresh token', 401);
  }
};

export const getProfile = async (req: Request, res: Response): Promise<void> => {
  const authReq = req as any;
  const userId = authReq.user?.id;

  const user = await db('users')
    .select('id', 'email', 'first_name', 'last_name', 'default_currency', 'timezone', 'created_at')
    .where('id', userId)
    .first();

  if (!user) {
    throw new AppError('User not found', 404);
  }

  res.json({ user });
};

export const updateProfile = async (req: Request, res: Response): Promise<void> => {
  const authReq = req as any;
  const userId = authReq.user?.id;
  const { first_name, last_name, default_currency, timezone } = req.body;

  const [user] = await db('users')
    .where('id', userId)
    .update({
      first_name,
      last_name,
      default_currency,
      timezone,
      updated_at: db.fn.now(),
    })
    .returning('*');

  res.json({
    user: {
      id: user.id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      default_currency: user.default_currency,
      timezone: user.timezone,
    },
  });
};
