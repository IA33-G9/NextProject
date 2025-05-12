import { NextResponse } from 'next/server';
import { PrismaClient } from '@/generated/prisma/client';

const prisma = new PrismaClient();


export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const movie = await prisma.movie.findUnique({
      where: { id: params.id },
      include: {
        showings: {
          where: {
            startTime: {
              gte: new Date()
            }
          },
          include: {
            screen: {
              include: {
                cinema: true
              }
            }
          },
          orderBy: {
            startTime: 'asc'
          }
        }
      }
    });

    if (!movie) {
      return NextResponse.json(
        { error: 'Movie not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(movie);
  } catch (error) {
    console.error('Error fetching movie details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch movie details' },
      { status: 500 }
    );
  }
}