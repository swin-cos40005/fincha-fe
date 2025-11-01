import { type NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { 
  getTemplateById, 
  incrementTemplateUsage 
} from '@/lib/db/queries';

// POST /api/templates/[id]/use - Mark a template as used (increment usage count)
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const segments = request.nextUrl.pathname.replace(/\/$/, '').split('/');
    const id = segments[segments.length - 2]; // 'use' is last, id is second last
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
    
    await incrementTemplateUsage(id);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to track template usage:', error);
    return NextResponse.json(
      { error: 'Failed to track template usage' },
      { status: 500 }
    );
  }
} 