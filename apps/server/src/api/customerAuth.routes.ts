// File: /apps/server/src/api/customerAuth.routes.ts (VERSIÓN A PRUEBA DE BALAS)

import { Router } from 'express';
import { z, ZodError } from 'zod';
import { hash, compare } from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma';
import { UserRole, Prisma } from '@prisma/client';

const router = Router();

const registerSchema = z.object({
  name: z.string().min(3, 'El nombre debe tener al menos 3 caracteres.'),
  email: z.string().email('El formato del email no es válido.'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres.'),
});

const loginSchema = z.object({
  email: z.string().email('El formato del email no es válido.'),
  password: z.string().min(1, 'La contraseña es requerida.'),
});

const generateAuthToken = (user: { id: string, email: string, role: UserRole }) => {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    console.error('Error Crítico: La variable de entorno JWT_SECRET no está definida.');
    throw new Error('La configuración del servidor está incompleta.');
  }

  // SOLUCIÓN DEFINITIVA: Usamos un NÚMERO (segundos) para expiresIn.
  // El .env tiene "604800s". parseInt lo convertirá a 604800.
  const expiresInSeconds = parseInt(process.env.JWT_EXPIRES_IN || '604800', 10);

  const tokenOptions: jwt.SignOptions = {
    expiresIn: expiresInSeconds,
  };
  
  return jwt.sign(
    { userId: user.id, email: user.email, role: user.role },
    jwtSecret,
    tokenOptions
  );
};

router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = registerSchema.parse(req.body);
    const passwordHash = await hash(password, 12);
    const newUser = await prisma.user.create({
      data: { name, email, passwordHash, role: UserRole.CUSTOMER, emailVerified: new Date() },
    });
    const token = generateAuthToken(newUser);
    res.status(201).json({
      message: 'Usuario registrado con éxito.',
      token,
      user: { id: newUser.id, name: newUser.name, email: newUser.email },
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ message: 'Datos de entrada inválidos.', errors: error.issues });
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return res.status(409).json({ message: 'Ya existe una cuenta con este email.' });
    }
    console.error('Error en el registro de cliente:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = loginSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.passwordHash) {
      return res.status(401).json({ message: 'Credenciales inválidas.' });
    }
    const isPasswordValid = await compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Credenciales inválidas.' });
    }
    if (user.role !== UserRole.CUSTOMER) {
        return res.status(403).json({ message: 'Acceso no autorizado para este tipo de cuenta.' });
    }
    const token = generateAuthToken(user);
    res.status(200).json({
      message: 'Login exitoso.',
      token,
      user: { id: user.id, name: user.name, email: user.email },
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ message: 'Datos de entrada inválidos.', errors: error.issues });
    }
    console.error('Error en el login de cliente:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
});

export default router;