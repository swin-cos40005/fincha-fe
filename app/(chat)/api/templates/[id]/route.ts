import { type NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { 
  getTemplateById, 
  updateTemplate, 
  deleteTemplate,
  incrementTemplateUsage 
} from '@/lib/db/queries';
import type { UpdateTemplateRequest } from '@/lib/types';

// GET /api/templates/[id] - Get a specific template
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const segments = request.nextUrl.pathname.replace(/\/$/, '').split('/');
    const id = segments[segments.length - 1];
    const template = await getTemplateById(id);
    
    if (!template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }
    
    // Check if user has access to this template
    const hasAccess = template.isPublic || 
                     template.userId === session.user.id;
    
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }
    
    return NextResponse.json({ template });
  } catch (error) {
    console.error('Failed to get template:', error);
    return NextResponse.json(
      { error: 'Failed to get template' },
      { status: 500 }
    );
  }
}

// PUT /api/templates/[id] - Update a template
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const segments = request.nextUrl.pathname.replace(/\/$/, '').split('/');
    const id = segments[segments.length - 1];
    const body: Partial<UpdateTemplateRequest> = await request.json();
    
    // Get existing template to check ownership
    const existingTemplate = await getTemplateById(id);
    
    if (!existingTemplate) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }
    
    // Only the owner can update
    if (existingTemplate.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }
    
    const template = await updateTemplate({
      ...body,
      id,
    });
    
    return NextResponse.json({ template });
  } catch (error) {
    console.error('Failed to update template:', error);
    return NextResponse.json(
      { error: 'Failed to update template' },
      { status: 500 }
    );
  }
}

// DELETE /api/templates/[id] - Delete a template
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const segments = request.nextUrl.pathname.replace(/\/$/, '').split('/');
    const id = segments[segments.length - 1];
    
    // Get existing template to check ownership
    const existingTemplate = await getTemplateById(id);
    
    if (!existingTemplate) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }
    
    // Only the owner can delete
    if (existingTemplate.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }
    
    await deleteTemplate(id, session.user.id);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete template:', error);
    return NextResponse.json(
      { error: 'Failed to delete template' },
      { status: 500 }
    );
  }
} 