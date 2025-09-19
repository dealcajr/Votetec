import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';

// Helper function to get the path to candidates.json
function getCandidatesPath() {
    // Correctly resolve the path to the public directory
    return path.resolve(process.cwd(), 'public/candidates.json');
}

export async function GET() {
    try {
        const filePath = getCandidatesPath();
        const data = await fs.readFile(filePath, 'utf-8');
        const candidates = JSON.parse(data);
        return NextResponse.json(candidates);
    } catch (error) {
        // If the file doesn't exist, return an empty array
        if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
            return NextResponse.json([]);
        }
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const candidates = await request.json();
        const filePath = getCandidatesPath();
        await fs.writeFile(filePath, JSON.stringify(candidates, null, 2), 'utf-8');
        return new NextResponse('OK', { status: 200 });
    } catch (error) {
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
