import { NextResponse } from 'next/server';
import { PrismaClient } from '@/generated/prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const movies = await prisma.movie.findMany({
      orderBy: { releaseDate: 'desc' },
      include: {
        _count: {
          select: {
            showings: {
              where: {
                startTime: {
                  gte: new Date()
                }
              }
            }
          }
        }
      }
    });

    const formattedMovies = movies.map(movie => {
      const { _count, ...rest } = movie;
      return {
        ...rest,
        showingCount: _count.showings
      };
    });

    return NextResponse.json(formattedMovies);
  } catch (error) {
    console.error('Error fetching movies:', error);
    return NextResponse.json({ error: 'Failed to fetch movies' }, { status: 500 });
  }
}
