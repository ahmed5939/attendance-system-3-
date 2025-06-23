import { prisma } from './prisma';

type LogLevel = 'INFO' | 'WARN' | 'ERROR';

export async function createLog(level: LogLevel, message: string, meta?: object) {
  try {
    await prisma.systemLog.create({
      data: {
        level,
        message,
        meta: meta || {},
      },
    });
  } catch (error) {
    console.error("Failed to create log:", error);
  }
} 