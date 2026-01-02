
import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';

// This API route checks the status of the election by looking for the final results file.
export async function GET() {
    try {
        const filePath = path.resolve(process.cwd(), 'public/final-results.json');
        
        // Try to access the file. If it exists, the election is closed.
        await fs.access(filePath);
        
        return NextResponse.json({ status: 'closed' });

    } catch (error) {
        // If the file does not exist (ENOENT), the election is still open.
        if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
            return NextResponse.json({ status: 'open' });
        }
        
        // For any other errors, return an internal server error.
        console.error("Failed to check election status:", error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
