
import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';
import { z } from 'zod';

const themeSchema = z.object({
    background: z.string().regex(/^(\d{1,3})\s+(\d{1,3})%\s+(\d{1,3})%$/, "Must be a valid HSL string 'H S% L%'"),
    foreground: z.string().regex(/^(\d{1,3})\s+(\d{1,3})%\s+(\d{1,3})%$/, "Must be a valid HSL string 'H S% L%'"),
    primary: z.string().regex(/^(\d{1,3})\s+(\d{1,3})%\s+(\d{1,3})%$/, "Must be a valid HSL string 'H S% L%'"),
    accent: z.string().regex(/^(\d{1,3})\s+(\d{1,3})%\s+(\d{1,3})%$/, "Must be a valid HSL string 'H S% L%'"),
});

const settingsSchema = z.object({
  appName: z.string().min(1),
  appDescription: z.string(),
  theme: themeSchema,
});

export type AppSettings = z.infer<typeof settingsSchema>;

function getSettingsPath() {
    return path.resolve(process.cwd(), 'public/settings.json');
}

const defaultSettings: AppSettings = {
    appName: "VoteChain",
    appDescription: "A simulated, secure and transparent voting system.",
    theme: {
        background: "0 0% 100%",
        foreground: "240 10% 3.9%",
        primary: "216 100% 74%",
        accent: "120 60% 45%",
    },
};

// Ensure default settings file exists
async function ensureDefaultSettings() {
    try {
        await fs.access(getSettingsPath());
    } catch (error) {
        await fs.writeFile(getSettingsPath(), JSON.stringify(defaultSettings, null, 2), 'utf-8');
    }
}

ensureDefaultSettings();

export async function GET() {
    try {
        const filePath = getSettingsPath();
        const data = await fs.readFile(filePath, 'utf-8');
        const settings = JSON.parse(data);
        return NextResponse.json(settings);
    } catch (error) {
        if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
            return NextResponse.json(defaultSettings);
        }
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const newSettings = await request.json();
        const validation = settingsSchema.safeParse(newSettings);
        if (!validation.success) {
            return new NextResponse(JSON.stringify(validation.error.errors), { status: 400 });
        }
        const filePath = getSettingsPath();
        await fs.writeFile(filePath, JSON.stringify(validation.data, null, 2), 'utf-8');
        return new NextResponse('OK', { status: 200 });
    } catch (error) {
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
