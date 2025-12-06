import fs from 'fs/promises';
import path from 'path';
import { PortfolioData } from '@/types/portfolio';

const DATA_FILE = path.join(process.cwd(), 'data', 'portfolio.json');

export async function getPortfolioData(): Promise<PortfolioData | null> {
    try {
        const data = await fs.readFile(DATA_FILE, 'utf-8');
        const parsedData = JSON.parse(data) as PortfolioData;

        // Environment Variables Override (for Vercel)
        if (!parsedData.calendar) {
            parsedData.calendar = {};
        }

        if (parsedData.calendar) {
            if (process.env.GOOGLE_REFRESH_TOKEN) {
                parsedData.calendar.refreshToken = process.env.GOOGLE_REFRESH_TOKEN;
            }
            if (process.env.GOOGLE_CLIENT_ID) {
                parsedData.calendar.oauthClientId = process.env.GOOGLE_CLIENT_ID;
            }
            if (process.env.GOOGLE_CLIENT_SECRET) {
                parsedData.calendar.oauthClientSecret = process.env.GOOGLE_CLIENT_SECRET;
            }
            if (process.env.GOOGLE_CALENDAR_API_KEY) {
                parsedData.calendar.apiKey = process.env.GOOGLE_CALENDAR_API_KEY;
            }

            // Ensure client-side checks pass if we have a refresh token (server will handle rotation)
            if (parsedData.calendar.refreshToken && (!parsedData.calendar.accessToken || parsedData.calendar.accessToken === '')) {
                parsedData.calendar.accessToken = 'managed_by_server';
            }
        }

        return parsedData;
    } catch (error) {
        console.error('Error reading portfolio data:', error);
        return null;
    }
}

export async function savePortfolioData(data: PortfolioData): Promise<boolean> {
    try {
        await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
        return true;
    } catch (error) {
        console.error('Error saving portfolio data:', error);
        return false;
    }
}
