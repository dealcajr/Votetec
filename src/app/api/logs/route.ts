import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';
import { z } from 'zod';

const logSchema = z.object({
  message: z.string(),
  type: z.enum(['INFO', 'ERROR', 'SUCCESS']),
  timestamp: z.string().datetime(),
});

type LogEntry = z.infer<typeof logSchema>;

function getLogsPath() {
    return path.resolve(process.cwd(), 'public/logs.json');
}

export async function GET() {
    try {
        const filePath = getLogsPath();
        const data = await fs.readFile(filePath, 'utf-8');
        const logs: LogEntry[] = JSON.parse(data);
        // Return logs in reverse chronological order
        return NextResponse.json(logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
    } catch (error) {
        if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
            await fs.writeFile(getLogsPath(), '[]', 'utf-8');
            return NextResponse.json([]);
        }
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const newLogPartial = await request.json();
        
        // Add timestamp server-side
        const newLog: LogEntry = {
            ...newLogPartial,
            timestamp: new Date().toISOString(),
        };

        // Validate the new log entry
        const validation = logSchema.safeParse(newLog);
        if (!validation.success) {
            return new NextResponse(JSON.stringify(validation.error.errors), { status: 400 });
        }

        const filePath = getLogsPath();
        let logs: LogEntry[] = [];
        try {
            const data = await fs.readFile(filePath, 'utf-8');
            logs = JSON.parse(data);
        } catch (error) {
            // File might not exist yet, which is okay
             if (error instanceof Error && 'code' in error && error.code !== 'ENOENT') {
                throw error;
             }
        }

        logs.push(newLog);
        
        await fs.writeFile(filePath, JSON.stringify(logs, null, 2), 'utf-8');

        return new NextResponse('OK', { status: 200 });
    } catch (error) {
        console.error("Failed to post log:", error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
