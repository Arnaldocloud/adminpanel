import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@/lib/database.types';

export const dynamic = 'force-dynamic';

type Card = {
  id: string;
  card_number: number;
  image_url: string;
  is_available: boolean;
  reserved_until: string | null;
};

type ApiResponse = {
  data: Card[];
  count: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = Math.min(parseInt(searchParams.get('pageSize') || '20'), 100);
    const search = searchParams.get('search') || null;
    
    const supabase = createRouteHandlerClient<Database>({ cookies });
    
    // Get total count for pagination
    const countQuery = supabase
      .from('card_inventory')
      .select('*', { count: 'exact', head: true });
    
    if (search) {
      countQuery.ilike('card_number', `%${search}%`);
    } else {
      countQuery.eq('is_available', true);
    }
    
    const { count } = await countQuery;
    
    // Get paginated results
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    
    let query = supabase
      .from('card_inventory')
      .select('*')
      .order('card_number', { ascending: true })
      .range(from, to);
    
    if (search) {
      query = query.ilike('card_number', `%${search}%`);
    } else {
      query = query.eq('is_available', true);
    }
    
    const { data: cards, error } = await query;
    
    if (error) {
      console.error('Error fetching cards:', error);
      return NextResponse.json(
        { error: 'Failed to fetch cards' },
        { status: 500 }
      );
    }
    
    const totalPages = Math.ceil((count || 0) / pageSize);
    
    const response: ApiResponse = {
      data: cards || [],
      count: count || 0,
      page,
      pageSize,
      totalPages,
    };
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('Unexpected error in GET /api/cards:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
