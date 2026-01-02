
import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';

// This API route is responsible for deleting the final election results file.
export async function DELETE() {
    try {
        const filePath = path.resolve(process.cwd(), 'public/final-results.json');
        
        // Delete the file. fs.unlink will throw an error if the file doesn't exist.
        await fs.unlink(filePath);
        
        return new NextResponse('OK', { status: 200 });

    } catch (error) {
        // If the file does not exist, it's not a failure in this context.
        // We can consider the operation "successful" as the file is gone.
        if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
            return new NextResponse('File not found, which is acceptable.', { status: 200 });
        }
        
        console.error("Failed to delete final results:", error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
