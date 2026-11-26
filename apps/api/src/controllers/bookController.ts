import type { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../config/prisma.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { AppError } from '../middleware/errorHandler.js';
import { fetchOnChainBookCopy } from '../blockchain/libraryClient.js';

const createBookSchema = z.object({
  chainBookId: z.number().int().positive(),
  title: z.string().min(1),
  author: z.string().min(1),
  isbn: z.string().min(1),
  category: z.string().min(1).default('General'),
});

const createCopySchema = z.object({
  chainCopyId: z.number().int().positive(),
});

export async function listBooks(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const query = typeof req.query.q === 'string' ? req.query.q.trim() : '';

    const books = await prisma.book.findMany({
      where: query
        ? {
            OR: [
              { title: { contains: query, mode: 'insensitive' } },
              { author: { contains: query, mode: 'insensitive' } },
              { isbn: { contains: query, mode: 'insensitive' } },
              { category: { contains: query, mode: 'insensitive' } },
            ],
          }
        : undefined,
      include: { copies: { orderBy: { chainCopyId: 'asc' } } },
      orderBy: { chainBookId: 'asc' },
    });

    const enriched = await Promise.all(
      books.map(async (book) => {
        const copiesWithChain = await Promise.all(
          book.copies.map(async (copy) => {
            const onChain = await fetchOnChainBookCopy(copy.chainCopyId);
            return {
              id: copy.id,
              chainCopyId: copy.chainCopyId,
              status: onChain?.status ?? 'UNKNOWN',
              reservedFor: onChain?.reservedFor ?? null,
            };
          }),
        );

        const availableCount = copiesWithChain.filter((c) => c.status === 'AVAILABLE').length;
        const borrowedCount = copiesWithChain.filter((c) => c.status === 'BORROWED').length;
        const reservedCount = copiesWithChain.filter((c) => c.status === 'RESERVED').length;

        return {
          ...book,
          copies: copiesWithChain,
          counts: {
            total: copiesWithChain.length,
            available: availableCount,
            borrowed: borrowedCount,
            reserved: reservedCount,
          },
        };
      }),
    );

    sendSuccess(res, { books: enriched });
  } catch (err) {
    next(err);
  }
}

export async function getBookById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = String(req.params.id);
    const book = await prisma.book.findUnique({
      where: { id },
      include: { copies: { orderBy: { chainCopyId: 'asc' } } },
    });

    if (!book) {
      throw new AppError(404, 'BOOK_NOT_FOUND', 'Book not found');
    }

    const copiesWithChain = await Promise.all(
      book.copies.map(async (copy) => {
        const onChain = await fetchOnChainBookCopy(copy.chainCopyId);
        return {
          id: copy.id,
          chainCopyId: copy.chainCopyId,
          status: onChain?.status ?? 'UNKNOWN',
          reservedFor: onChain?.reservedFor ?? null,
        };
      }),
    );

    sendSuccess(res, { book: { ...book, copies: copiesWithChain } });
  } catch (err) {
    next(err);
  }
}

export async function createBook(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const payload = createBookSchema.parse(req.body);
    const book = await prisma.book.upsert({
      where: { chainBookId: payload.chainBookId },
      update: {
        title: payload.title,
        author: payload.author,
        isbn: payload.isbn,
        category: payload.category,
      },
      create: payload,
    });
    sendSuccess(res, { book }, 201);
  } catch (err) {
    next(err);
  }
}

export async function addBookCopy(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = String(req.params.id);
    const { chainCopyId } = createCopySchema.parse(req.body);
    const book = await prisma.book.findUnique({ where: { id } });
    if (!book) {
      throw new AppError(404, 'BOOK_NOT_FOUND', 'Book not found');
    }

    const copy = await prisma.bookCopy.upsert({
      where: { chainCopyId },
      update: {},
      create: {
        chainCopyId,
        bookId: book.id,
      },
    });
    sendSuccess(res, { copy }, 201);
  } catch (err) {
    next(err);
  }
}
