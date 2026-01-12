import { NextRequest, NextResponse } from 'next/server';

// Einfaches In-Memory Rate-Limiting (für Vercel Serverless)
// In Produktion könnte man Redis verwenden, aber für den Start reicht das
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

// Rate-Limiting: Max 5 Requests pro IP pro 15 Minuten
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 Minuten in Millisekunden

function getRateLimitKey(request: NextRequest): string {
  // Nutze IP-Adresse für Rate-Limiting
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip') || 'unknown';
  return ip;
}

function checkRateLimit(ip: string): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record || now > record.resetTime) {
    // Neuer Zeitfenster
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return { allowed: true, remaining: RATE_LIMIT_MAX - 1, resetTime: now + RATE_LIMIT_WINDOW };
  }

  if (record.count >= RATE_LIMIT_MAX) {
    return { allowed: false, remaining: 0, resetTime: record.resetTime };
  }

  record.count++;
  return { allowed: true, remaining: RATE_LIMIT_MAX - record.count, resetTime: record.resetTime };
}

// CORS-Header für Embed-Nutzung
function getCorsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*', // Erlaubt alle Domains (für WordPress Embed)
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400', // 24 Stunden
  };
}

// OPTIONS Handler für CORS Preflight
export async function OPTIONS(request: NextRequest) {
  return NextResponse.json({}, { headers: getCorsHeaders() });
}

export async function POST(request: NextRequest) {
  try {
    // Rate-Limiting prüfen
    const ip = getRateLimitKey(request);
    const rateLimit = checkRateLimit(ip);

    if (!rateLimit.allowed) {
      const retryAfter = Math.ceil((rateLimit.resetTime - Date.now()) / 1000);
      return NextResponse.json(
        { 
          error: 'Zu viele Anfragen. Bitte versuchen Sie es später erneut.',
          retryAfter 
        },
        { 
          status: 429,
          headers: {
            ...getCorsHeaders(),
            'Retry-After': retryAfter.toString(),
            'X-RateLimit-Limit': RATE_LIMIT_MAX.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': new Date(rateLimit.resetTime).toISOString(),
          }
        }
      );
    }

    // Content-Type-Validierung
    const contentType = request.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      return NextResponse.json(
        { error: 'Content-Type muss application/json sein' },
        { 
          status: 400,
          headers: getCorsHeaders()
        }
      );
    }

    // Hole die Daten aus dem Request
    let data;
    try {
      data = await request.json();
    } catch (error) {
      return NextResponse.json(
        { error: 'Ungültiges JSON-Format' },
        { 
          status: 400,
          headers: getCorsHeaders()
        }
      );
    }

    // Hole die Webhook-URL aus der Umgebungsvariable (sicher!)
    const webhookUrl = process.env.MAKE_WEBHOOK_URL;
    
    if (!webhookUrl) {
      console.error('MAKE_WEBHOOK_URL ist nicht gesetzt');
      return NextResponse.json(
        { error: 'Webhook URL nicht konfiguriert' },
        { 
          status: 500,
          headers: getCorsHeaders()
        }
      );
    }

    // Validiere die Daten (erweiterte Checks)
    if (!data.name || typeof data.name !== 'string' || data.name.trim().length < 2) {
      return NextResponse.json(
        { error: 'Name muss mindestens 2 Zeichen lang sein' },
        { 
          status: 400,
          headers: getCorsHeaders()
        }
      );
    }

    if (!data.email || typeof data.email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      return NextResponse.json(
        { error: 'Ungültige E-Mail-Adresse' },
        { 
          status: 400,
          headers: getCorsHeaders()
        }
      );
    }

    if (!data.phone || typeof data.phone !== 'string' || data.phone.trim().length < 8) {
      return NextResponse.json(
        { error: 'Telefonnummer muss mindestens 8 Zeichen lang sein' },
        { 
          status: 400,
          headers: getCorsHeaders()
        }
      );
    }

    // Sende an Make.com Webhook
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Webhook-Fehler:', errorText);
      throw new Error('Webhook-Fehler');
    }

    return NextResponse.json(
      { success: true },
      {
        headers: {
          ...getCorsHeaders(),
          'X-RateLimit-Limit': RATE_LIMIT_MAX.toString(),
          'X-RateLimit-Remaining': rateLimit.remaining.toString(),
          'X-RateLimit-Reset': new Date(rateLimit.resetTime).toISOString(),
        }
      }
    );
  } catch (error) {
    console.error('Fehler beim Senden:', error);
    return NextResponse.json(
      { error: 'Fehler beim Senden der Daten' },
      { 
        status: 500,
        headers: getCorsHeaders()
      }
    );
  }
}
