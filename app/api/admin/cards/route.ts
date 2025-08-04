import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@/lib/database.types';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

type CardInventory = {
  id?: string;
  card_number: number;
  image_url: string;
  price: number;
  is_available: boolean;
  reserved_until?: string | null;
  reserved_by?: string | null;
  sold_at?: string | null;
  sold_to?: string | null;
  created_at?: string;
  updated_at?: string;
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = Math.min(parseInt(searchParams.get('pageSize') || '20'), 100);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || 'all'; // all, available, reserved, sold
    
    const supabase = createRouteHandlerClient<Database>({ cookies });
    
    // Verify admin access
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Build the query
    let query = supabase
      .from('card_inventory')
      .select('*', { count: 'exact' });
    
    // Apply filters
    if (search) {
      query = query.ilike('card_number', `%${search}%`);
    }
    
    if (status !== 'all') {
      switch (status) {
        case 'available':
          query = query.eq('is_available', true);
          break;
        case 'reserved':
          query = query.eq('is_available', false).not('reserved_until', 'is', null);
          break;
        case 'sold':
          query = query.not('sold_at', 'is', null);
          break;
      }
    }
    
    // Get total count
    const { count } = await query;
    
    // Apply pagination
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    
    const { data: cards, error } = await query
      .order('card_number', { ascending: true })
      .range(from, to);
    
    if (error) {
      console.error('Error fetching card inventory:', error);
      return NextResponse.json(
        { error: 'Failed to fetch card inventory' },
        { status: 500 }
      );
    }
    
    const totalPages = Math.ceil((count || 0) / pageSize);
    
    return NextResponse.json({
      data: cards || [],
      pagination: {
        page,
        pageSize,
        totalItems: count || 0,
        totalPages,
      },
    });
    
  } catch (error) {
    console.error('Unexpected error in GET /api/admin/cards:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    
    // Verify admin access
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const cardData: Omit<CardInventory, 'id' | 'created_at' | 'updated_at'> = await request.json();
    
    // Validate required fields
    if (!cardData.card_number || !cardData.image_url || cardData.price === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Check if card number already exists
    const { data: existingCard } = await supabase
      .from('card_inventory')
      .select('id')
      .eq('card_number', cardData.card_number)
      .single();
    
    if (existingCard) {
      return NextResponse.json(
        { error: 'A card with this number already exists' },
        { status: 409 }
      );
    }
    
    // Create the card
    const { data: newCard, error } = await supabase
      .from('card_inventory')
      .insert([{
        ...cardData,
        is_available: cardData.is_available ?? true,
      }])
      .select()
      .single();
    
    if (error) {
      console.error('Error creating card:', error);
      return NextResponse.json(
        { error: 'Failed to create card' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(newCard, { status: 201 });
    
  } catch (error) {
    console.error('Unexpected error in POST /api/admin/cards:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    
    // Verify admin access
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const { id, ...updates } = await request.json();
    
    if (!id) {
      return NextResponse.json(
        { error: 'Card ID is required' },
        { status: 400 }
      );
    }
    
    // Update the card
    const { data: updatedCard, error } = await supabase
      .from('card_inventory')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating card:', error);
      return NextResponse.json(
        { error: 'Failed to update card' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(updatedCard);
    
  } catch (error) {
    console.error('Unexpected error in PUT /api/admin/cards:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'Card ID is required' },
        { status: 400 }
      );
    }
    
    const supabase = createRouteHandlerClient<Database>({ cookies });
    
    // Verify admin access
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Check if card exists and is not sold
    const { data: card, error: fetchError } = await supabase
      .from('card_inventory')
      .select('id, sold_at')
      .eq('id', id)
      .single();
    
    if (fetchError) {
      return NextResponse.json(
        { error: 'Card not found' },
        { status: 404 }
      );
    }
    
    if (card.sold_at) {
      return NextResponse.json(
        { error: 'Cannot delete a card that has been sold' },
        { status: 400 }
      );
    }
    
    // Delete the card
    const { error: deleteError } = await supabase
      .from('card_inventory')
      .delete()
      .eq('id', id);
    
    if (deleteError) {
      console.error('Error deleting card:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete card' },
        { status: 500 }
      );
    }
    
    return new Response(null, { status: 204 });
    
  } catch (error) {
    console.error('Unexpected error in DELETE /api/admin/cards:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
