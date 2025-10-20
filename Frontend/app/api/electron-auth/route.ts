import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { access_token, refresh_token, user, source } = await request.json();
    
    // In a real scenario, we'd use a more sophisticated approach
    // For now, we'll store in a global Map that persists during the app session
    if (typeof global !== 'undefined') {
      if (!(global as any).pendingAuth) {
        (global as any).pendingAuth = {};
      }
      
      (global as any).pendingAuth = {
        access_token,
        refresh_token,
        user,
        timestamp: Date.now()
      };
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Auth data received' 
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const pending = (global as any).pendingAuth;
    
    if (!pending) {
      return NextResponse.json({ 
        success: false, 
        message: 'No pending auth' 
      });
    }
    
    // Check if auth data is less than 2 minutes old
    const age = Date.now() - pending.timestamp;
    if (age > 120000) { // 2 minutes
      delete (global as any).pendingAuth;
      return NextResponse.json({ 
        success: false, 
        message: 'Auth data expired' 
      });
    }
    
    // Clear after retrieval
    const data = { ...pending };
    delete (global as any).pendingAuth;
    
    return NextResponse.json({ 
      success: true,
      ...data
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
