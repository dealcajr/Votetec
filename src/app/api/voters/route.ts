import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';
import { z } from 'zod';

function getVotersPath() {
    return path.resolve(process.cwd(), 'public/voters.json');
}

const voterSchema = z.object({
  id: z.string().min(1, "Voter ID is required"),
  name: z.string().min(1, "Name is required"),
  grade: z.string().min(1, "Grade is required"),
  strand: z.string().min(1, "Strand is required"),
});

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

export async function POST(request: Request) {
    try {
        const body = await request.json();

        // Check if it's an array for bulk import or a single object for registration
        if (Array.isArray(body)) {
            // Bulk update from admin
            await fs.writeFile(getVotersPath(), JSON.stringify(body, null, 2), 'utf-8');
            return new NextResponse('OK', { status: 200 });
        } else {
            // Single voter registration
            const validation = voterSchema.safeParse(body);
            if (!validation.success) {
                return new NextResponse(JSON.stringify({ message: "Invalid voter data", errors: validation.error.flatten().fieldErrors }), { status: 400 });
            }

            const newVoter = validation.data;
            const filePath = getVotersPath();
            let voters = [];

            try {
                const data = await fs.readFile(filePath, 'utf-8');
                voters = JSON.parse(data);
            } catch (error) {
                if (error instanceof Error && 'code' in error && error.code !== 'ENOENT') {
                    throw error;
                }
            }

            // Check if voter ID already exists
            if (voters.some((v: { id: string }) => v.id === newVoter.id)) {
                return new NextResponse(JSON.stringify({ message: `Voter with ID ${newVoter.id} already exists.` }), { status: 409 });
            }

            voters.push(newVoter);
            await fs.writeFile(filePath, JSON.stringify(voters, null, 2), 'utf-8');
            return NextResponse.json(newVoter, { status: 201 });
        }
    } catch (error) {
        console.error("Error in POST /api/voters:", error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
