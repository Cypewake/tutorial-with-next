import { NextResponse } from 'next/server';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const API_SECRET = process.env.API_SECRET || 'change-me-in-production';

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY environment variables');
}

// 限流器
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 100;
const RATE_WINDOW = 60 * 1000;

function checkRateLimit(clientId: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(clientId);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(clientId, { count: 1, resetTime: now + RATE_WINDOW });
    return true;
  }

  if (record.count >= RATE_LIMIT) {
    return false;
  }

  record.count++;
  return true;
}

async function callSupabaseRpc(functionName: string, params: Record<string, unknown>) {
  const url = `${SUPABASE_URL}/rest/v1/rpc/${functionName}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_SERVICE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      'Prefer': 'return=representation',
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Supabase RPC failed: ${response.status} - ${errorText}`);
  }

  return await response.json();
}

export async function POST(request: Request) {
  try {
    // 验证 API 密钥
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json(
        { success: false, error: '缺少 Authorization 头' },
        { status: 401 }
      );
    }

    const [scheme, key] = authHeader.split(' ');
    if (scheme !== 'Bearer' || key !== API_SECRET) {
      return NextResponse.json(
        { success: false, error: '无效的 API 密钥' },
        { status: 403 }
      );
    }

    // 限流检查
    const clientId = request.headers.get('x-forwarded-for') || 'unknown';
    if (!checkRateLimit(clientId)) {
      return NextResponse.json(
        { success: false, error: '请求过于频繁，请稍后重试' },
        { status: 429 }
      );
    }

    // 解析请求体
    const body = await request.json();
    const { action, ...params } = body;

    if (!action) {
      return NextResponse.json(
        { success: false, error: '缺少 action 参数' },
        { status: 400 }
      );
    }

    // 路由到对应的 Supabase RPC 函数
    let rpcFunction: string;
    switch (action) {
      case 'activate':
        rpcFunction = 'activate_card';
        break;
      case 'consume':
        rpcFunction = 'consume_usage';
        break;
      case 'get-remaining':
        rpcFunction = 'get_card_remaining';
        break;
      case 'redeem-invite':
        rpcFunction = 'redeem_invite_code';
        break;
      case 'register-invite':
        rpcFunction = 'register_invite_code';
        break;
      case 'get-invite-code':
        rpcFunction = 'get_device_invite_code';
        break;
      default:
        return NextResponse.json(
          { success: false, error: `未知的 action: ${action}` },
          { status: 400 }
        );
    }

    const data = await callSupabaseRpc(rpcFunction, params);

    return NextResponse.json({
      success: true,
      data: data,
    });
  } catch (error) {
    console.error('[Proxy API Error]:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '未知错误',
      },
      { status: 500 }
    );
  }
}
