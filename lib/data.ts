import fs from 'fs/promises';
import path from 'path';
import { PortfolioData } from '@/types/portfolio';

const DATA_FILE = path.join(process.cwd(), 'data', 'portfolio.json');

export async function getPortfolioData(): Promise<PortfolioData | null> {
    try {
        const data = await fs.readFile(DATA_FILE, 'utf-8');
        return JSON.parse(data) as PortfolioData;
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
