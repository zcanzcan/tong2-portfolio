import { NextResponse } from 'next/server';
import { getPortfolioData, savePortfolioData } from '@/lib/data';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const data = await getPortfolioData();
        if (!data || !data.projects) {
            return NextResponse.json([]);
        }
        return NextResponse.json(data.projects);
    } catch (error) {
        console.error('Error fetching projects:', error);
        return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const newProject = await request.json();
        
        // Ensure required fields
        if (!newProject.title) {
            return NextResponse.json({ error: 'Project title is required' }, { status: 400 });
        }

        // Generate ID if not provided
        if (!newProject.id) {
            newProject.id = Date.now();
        }

        const data = await getPortfolioData();

        if (!data) {
            return NextResponse.json({ error: 'Failed to load data' }, { status: 500 });
        }

        if (!data.projects) data.projects = [];
        data.projects.push(newProject);

        const success = await savePortfolioData(data);
        if (!success) {
            return NextResponse.json({ error: 'Failed to save data' }, { status: 500 });
        }

        return NextResponse.json({ message: 'Project added successfully', project: newProject });
    } catch (error) {
        console.error('Error adding project:', error);
        const errorMessage = error instanceof Error ? error.message : 'Invalid request';
        return NextResponse.json({ error: errorMessage }, { status: 400 });
    }
}

export async function PUT(request: Request) {
    try {
        const { index, project } = await request.json();
        
        if (index === undefined || index === null) {
            return NextResponse.json({ error: 'Index is required' }, { status: 400 });
        }

        if (!project || !project.title) {
            return NextResponse.json({ error: 'Project data and title are required' }, { status: 400 });
        }

        const data = await getPortfolioData();

        if (!data || !data.projects) {
            return NextResponse.json({ error: 'Failed to load data' }, { status: 500 });
        }

        if (index >= 0 && index < data.projects.length) {
            // Preserve existing ID if not provided
            if (!project.id && data.projects[index].id) {
                project.id = data.projects[index].id;
            }
            data.projects[index] = project;
            const success = await savePortfolioData(data);

            if (success) {
                return NextResponse.json({ success: true });
            } else {
                return NextResponse.json({ error: 'Failed to save' }, { status: 500 });
            }
        } else {
            return NextResponse.json({ error: `Invalid index: ${index}` }, { status: 400 });
        }
    } catch (error) {
        console.error('Error updating project:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to update project';
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const { index } = await request.json();
        
        if (index === undefined || index === null) {
            return NextResponse.json({ error: 'Index is required' }, { status: 400 });
        }

        const data = await getPortfolioData();

        if (!data || !data.projects) {
            return NextResponse.json({ error: 'Failed to load data' }, { status: 500 });
        }

        if (index >= 0 && index < data.projects.length) {
            data.projects.splice(index, 1);
            const success = await savePortfolioData(data);

            if (success) {
                return NextResponse.json({ success: true });
            } else {
                return NextResponse.json({ error: 'Failed to save' }, { status: 500 });
            }
        } else {
            return NextResponse.json({ error: `Invalid index: ${index}` }, { status: 400 });
        }
    } catch (error) {
        console.error('Error deleting project:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to delete project';
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}
