
import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';

// This API route is responsible for saving the final election results to a file.
export async function POST(request: Request) {
    try {
        const resultsReport = await request.json();
        
        // Define the path where the results will be saved.
        const filePath = path.resolve(process.cwd(), 'public/final-results.json');
        
        // Write the JSON report to the file system, nicely formatted.
        await fs.writeFile(filePath, JSON.stringify(resultsReport, null, 2), 'utf-8');
        
        return new NextResponse('OK', { status: 200 });
    } catch (error) {
        console.error("Failed to save final results:", error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
