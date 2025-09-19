import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';

function getVotesPath() {
    return path.resolve(process.cwd(), 'public/votes.json');
}

export async function GET() {
    try {
        const filePath = getVotesPath();
        const data = await fs.readFile(filePath, 'utf-8');
        const votes = JSON.parse(data);
        return NextResponse.json(votes);
    } catch (error) {
        if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
            return NextResponse.json({});
        }
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const votes = await request.json();
        const filePath = getVotesPath();
        await fs.writeFile(filePath, JSON.stringify(votes, null, 2), 'utf-8');
        return new NextResponse('OK', { status: 200 });
    } catch (error) {
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
