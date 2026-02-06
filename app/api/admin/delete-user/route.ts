import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// Initialize admin client with service role key (server-side only)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { success: false, message: 'Email is required' },
        { status: 400 }
      );
    }

    console.log(`🗑️ [ADMIN API] Deleting user: ${email}`);

    // Step 1: Find user in auth.users
    const { data: usersData, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (listError) {
      console.error('❌ [ADMIN API] Error listing users:', listError);
      return NextResponse.json(
        { success: false, message: 'Failed to access user database', details: listError.message },
        { status: 500 }
      );
    }

    const targetUser = usersData?.users?.find(user => user.email === email);
    
    if (!targetUser) {
      console.log('⚠️ [ADMIN API] User not found in auth system:', email);
      return NextResponse.json(
        { success: false, message: 'User not found in auth system' },
        { status: 404 }
      );
    }

    // Step 2: Delete from custom users table
    const { error: profileError } = await supabaseAdmin
      .from('users')
      .delete()
      .eq('id', targetUser.id);

    if (profileError) {
      console.error('❌ [ADMIN API] Error deleting user profile:', profileError);
      // Continue with auth deletion even if profile deletion fails
    } else {
      console.log('✅ [ADMIN API] Deleted user from custom users table');
    }

    // Step 3: Delete from auth.users
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(targetUser.id);
    
    if (deleteError) {
      console.error('❌ [ADMIN API] Error deleting auth user:', deleteError);
      return NextResponse.json(
        { 
          success: false, 
          message: `Failed to delete auth user: ${deleteError.message}` 
        },
        { status: 500 }
      );
    }

    console.log('✅ [ADMIN API] Successfully deleted user from auth system');
    
    return NextResponse.json({
      success: true,
      message: `Successfully deleted user: ${email}. You can now retry signup.`
    });

  } catch (error: any) {
    console.error('❌ [ADMIN API] Unexpected error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: `Server error: ${error.message}` 
      },
      { status: 500 }
    );
  }
}
