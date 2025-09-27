import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';

function getVotersPath() {
    return path.resolve(process.cwd(), 'public/voters.json');
}

export async function GET() {
    try {
        const filePath = getVotersPath();
        const data = await fs.readFile(filePath, 'utf-8');
        const voters = JSON.parse(data);
        return NextResponse.json(voters);
    } catch (error) {
        if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
            await fs.writeFile(getVotersPath(), '[]', 'utf-8');
            return NextResponse.json([]);
        }
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
