import { type NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { 
  getTemplatesByFilters, 
  getAllTemplateCategories,
  createTemplate,
  incrementTemplateUsage,
  createTemplateCategory
} from '@/lib/db/queries';
import { SYSTEM_TEMPLATE_CATEGORIES, SYSTEM_TEMPLATES } from '@/lib/templates';
import type { CreateTemplateRequest, TemplateSearchFilters } from '@/lib/types';

// Helper function to ensure system categories exist
async function ensureSystemCategoriesExist() {
  try {
    const existingCategories = await getAllTemplateCategories();
    const existingIds = new Set(existingCategories.map(cat => cat.id));
    
    for (const systemCategory of SYSTEM_TEMPLATE_CATEGORIES) {
      if (!existingIds.has(systemCategory.id)) {
        await createTemplateCategory(systemCategory);
      }
    }
  } catch (error) {
    console.error('Failed to seed system categories:', error);
    // Don't throw - just log the error so template creation can continue
  }
}

// Helper function to ensure system templates exist
async function ensureSystemTemplatesExist() {
  try {
    // Get existing templates to check which ones need to be seeded
    const existingTemplates = await getTemplatesByFilters({}, 1, 1000);
    const existingIds = new Set(existingTemplates.templates.map(t => t.id));
    
    for (const systemTemplate of SYSTEM_TEMPLATES) {
      if (!existingIds.has(systemTemplate.id)) {
        await createTemplate({
          ...systemTemplate,
          userId: undefined, // System templates don't belong to a specific user
        });
      }
    }
  } catch (error) {
    console.error('Failed to seed system templates:', error);
    // Don't throw - just log the error so template operations can continue
  }
}

// GET /api/templates - Get templates with optional filters
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Ensure system categories and templates exist
    await ensureSystemCategoriesExist();
    await ensureSystemTemplatesExist();

    const searchParams = request.nextUrl.searchParams;
    
    // Parse filters from query parameters
    const filters: TemplateSearchFilters = {};
    
    const categoryId = searchParams.get('categoryId');
    if (categoryId) filters.categoryId = categoryId;
    

    
    const isPublic = searchParams.get('isPublic');
    if (isPublic !== null) filters.isPublic = isPublic === 'true';
    
    const search = searchParams.get('search');
    if (search) filters.search = search;
    
    // Always include user's own templates
    const userTemplatesFilters = { ...filters, userId: session.user.id };
    const publicTemplatesFilters = { ...filters, isPublic: true };
    
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    
    // Get all relevant templates
    const [userTemplates, publicTemplates, categories] = await Promise.all([
      getTemplatesByFilters(userTemplatesFilters, page, pageSize),
      getTemplatesByFilters(publicTemplatesFilters, page, pageSize),
      getAllTemplateCategories(),
    ]);
    
    // Combine and deduplicate templates
    const allTemplates = [
      ...userTemplates.templates,
      ...publicTemplates.templates,
    ];
    
    // Remove duplicates based on ID
    const uniqueTemplates = allTemplates.filter((template, index, self) => 
      index === self.findIndex(t => t.id === template.id)
    );
    
    const total = userTemplates.total + publicTemplates.total;
    
    return NextResponse.json({
      templates: uniqueTemplates,
      categories,
      total,
      page,
      pageSize,
    });
  } catch (error) {
    console.error('Failed to get templates:', error);
    return NextResponse.json(
      { error: 'Failed to get templates' },
      { status: 500 }
    );
  }
}

// POST /api/templates - Create a new template
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: CreateTemplateRequest = await request.json();
    
    // Validate required fields
    if (!body.name || !body.description || !body.categoryId || !body.data) {
      return NextResponse.json(
        { error: 'Missing required fields: name, description, categoryId, data' },
        { status: 400 }
      );
    }
    
    // Validate workflow data structure
    if (!body.data.nodes || !Array.isArray(body.data.nodes) || 
        !body.data.edges || !Array.isArray(body.data.edges)) {
      return NextResponse.json(
        { error: 'Invalid workflow data structure' },
        { status: 400 }
      );
    }
    
    // Ensure system categories are seeded
    await ensureSystemCategoriesExist();
    
    const template = await createTemplate({
      ...body,
      userId: session.user.id,
    });
    
    return NextResponse.json({ template }, { status: 201 });
  } catch (error) {
    console.error('Failed to create template:', error);
    return NextResponse.json(
      { error: 'Failed to create template' },
      { status: 500 }
    );
  }
} 