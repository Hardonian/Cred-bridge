import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const iss = searchParams.get('iss') || 'https://canvas.example.edu';
  const loginHint = searchParams.get('login_hint') || 'learner_123';
  const targetLinkUri = searchParams.get('target_link_uri') || 'https://credbridge.example/api/lti/launch';
  const ltiMessageHint = searchParams.get('lti_message_hint') || '';

  const authUrl = new URL(`${iss}/api/lti/authorize`);
  authUrl.searchParams.set('response_type', 'id_token');
  authUrl.searchParams.set('scope', 'openid');
  authUrl.searchParams.set('client_id', 'credbridge-client-id');
  authUrl.searchParams.set('redirect_uri', targetLinkUri);
  authUrl.searchParams.set('login_hint', loginHint);
  authUrl.searchParams.set('response_mode', 'form_post');
  authUrl.searchParams.set('nonce', `nonce_${Date.now()}`);
  authUrl.searchParams.set('prompt', 'none');
  if (ltiMessageHint) {
    authUrl.searchParams.set('lti_message_hint', ltiMessageHint);
  }

  return NextResponse.redirect(authUrl.toString(), 302);
}
