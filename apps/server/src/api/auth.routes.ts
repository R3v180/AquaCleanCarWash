import { Router } from 'express';
import { compare } from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { UserRole } from '@prisma/client';

const router = Router();

// Esquema de validación para los datos del login
const loginSchema = z.object({
  email: z.string().email('El formato del email no es válido.'),
  password: z.string().min(1, 'La contraseña es requerida.'),
});

router.post('/login', async (req, res) => {
  try {
    // 1. Validar los datos de entrada
    const { email, password } = loginSchema.parse(req.body);

    // 2. Buscar al usuario administrador en la base de datos
    const adminUser = await prisma.user.findUnique({
      where: { email },
    });

    // 3. Verificar si el usuario existe y si es un administrador
    if (!adminUser || adminUser.role !== UserRole.ADMIN) {
      return res.status(401).json({ message: 'Credenciales inválidas.' });
    }

    // 4. Comparar la contraseña enviada con el hash guardado
    const isPasswordValid = await compare(password, adminUser.passwordHash!);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Credenciales inválidas.' });
    }

    // 5. Generar el Token JWT
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error('Error: La variable de entorno JWT_SECRET no está definida.');
      return res.status(500).json({ message: 'Error interno del servidor.' });
    }

    const token = jwt.sign(
      {
        userId: adminUser.id,
        email: adminUser.email,
        role: adminUser.role,
      },
      jwtSecret,
      { expiresIn: '1d' } // El token expirará en 1 día
    );

    // 6. Enviar el token al cliente
    res.status(200).json({
      message: 'Login exitoso.',
      token,
      user: {
        id: adminUser.id,
        name: adminUser.name,
        email: adminUser.email,
        role: adminUser.role,
      },
    });
  } catch (error) {
    console.error('Error en el login:', error);
    // Si el error es de validación de Zod, enviamos una respuesta más específica
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Datos de entrada inválidos.', errors: error.issues });
    }
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
});

export default router;