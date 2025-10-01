// File: /apps/server/src/lib/prisma.ts

import { PrismaClient } from '@prisma/client';

// Se recomienda instanciar PrismaClient una sola vez en tu aplicación.
// Esto evita agotar el número de conexiones a la base de datos.
// https://www.prisma.io/docs/guides/performance-and-optimization/connection-management#prismaclient-in-long-running-applications

const prisma = new PrismaClient();

export default prisma;