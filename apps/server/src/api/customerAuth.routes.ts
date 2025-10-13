// File: /apps/server/src/api/customerAuth.routes.ts (CON FLUJO DE VERIFICACIÓN DE EMAIL)

import { Router } from 'express';
import { z, ZodError } from 'zod';
import { hash, compare } from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto'; // <-- Importación añadida
import dayjs from 'dayjs'; // <-- Importación añadida
import prisma from '../lib/prisma';
import { UserRole, Prisma } from '@prisma/client';
import { notificationService } from '../lib/notificationService'; // <-- Importación añadida

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
  if (!jwtSecret) { throw new Error('La configuración del servidor está incompleta.'); }
  const expiresInSeconds = parseInt(process.env.JWT_EXPIRES_IN || '604800', 10);
  return jwt.sign(
    { userId: user.id, email: user.email, role: user.role },
    jwtSecret,
    { expiresIn: expiresInSeconds }
  );
};

// --- ENDPOINT DE REGISTRO MODIFICADO ---
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = registerSchema.parse(req.body);
    const passwordHash = await hash(password, 12);

    // 1. Crear usuario con email no verificado
    const newUser = await prisma.user.create({
      data: { name, email, passwordHash, role: UserRole.CUSTOMER, emailVerified: null },
    });

    // 2. Generar y guardar token de verificación
    const token = crypto.randomBytes(32).toString('hex');
    const expires = dayjs().add(24, 'hour').toDate();
    await prisma.verificationToken.create({
        data: { identifier: email, token, expires },
    });

    // 3. Enviar email de verificación
    await notificationService.sendVerificationEmail(email, token);
    
    // 4. Responder al frontend
    res.status(201).json({
      message: 'Registro exitoso. Por favor, revisa tu email para activar tu cuenta.',
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

// --- NUEVO ENDPOINT DE VERIFICACIÓN ---
router.get('/verify-email', async (req, res) => {
    const { token } = req.query;

    if (typeof token !== 'string' || !token) {
        return res.status(400).send('Token no proporcionado o inválido.');
    }

    try {
        const verificationToken = await prisma.verificationToken.findUnique({
            where: { token },
        });

        if (!verificationToken || dayjs(verificationToken.expires).isBefore(dayjs())) {
            return res.status(400).redirect(`${process.env.CORS_ALLOWED_ORIGIN}/login?error=invalid_token`);
        }

        // Marcar al usuario como verificado
        await prisma.user.update({
            where: { email: verificationToken.identifier },
            data: { emailVerified: new Date() },
        });

        // Eliminar el token para que no se pueda reusar
        await prisma.verificationToken.delete({ where: { token } });
        
        // Redirigir al login con mensaje de éxito
        res.redirect(`${process.env.CORS_ALLOWED_ORIGIN}/login?verified=true`);

    } catch (error) {
        console.error('Error al verificar el email:', error);
        res.status(500).redirect(`${process.env.CORS_ALLOWED_ORIGIN}/login?error=server_error`);
    }
});


// --- ENDPOINT DE LOGIN MODIFICADO ---
router.post('/login', async (req, res) => {
  try {
    const { email, password } = loginSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || !user.passwordHash) {
      return res.status(401).json({ message: 'Credenciales inválidas.' });
    }

    // --- NUEVA COMPROBACIÓN DE SEGURIDAD ---
    if (!user.emailVerified) {
        return res.status(403).json({ message: 'Tu cuenta no ha sido verificada. Por favor, revisa tu email.' });
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