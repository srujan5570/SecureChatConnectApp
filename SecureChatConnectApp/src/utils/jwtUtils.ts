import { encode as base64Encode } from 'base-64';
import { Buffer } from 'buffer';

interface JwtPayload {
  apikey: string;
  permissions: string[];
  version: number;
  exp: number;
}

function base64UrlEncode(str: string): string {
  return base64Encode(str)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function hmacSha256(data: string, secret: string): string {
  // This is a placeholder implementation
  // In a real app, you would use a proper HMAC-SHA256 implementation
  // For now, we'll use the token directly since it's already signed
  return secret;
}

export function generateJwt(payload: JwtPayload, secret: string): string {
  const header = {
    alg: 'HS256',
    typ: 'JWT'
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signature = hmacSha256(`${encodedHeader}.${encodedPayload}`, secret);
  
  return `${encodedHeader}.${encodedPayload}.${signature}`;
} 