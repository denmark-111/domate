import { createRemoteJWKSet, jwtVerify } from 'jose';

// Initialize with your Supabase project URL on server startup, for example:
// import { initSupabaseJwks, supabaseAuthMiddleware } from './middleware/supabaseAuth.js'
// initSupabaseJwks(process.env.SUPABASE_URL)

let jwks; // JWK set handler created by createRemoteJWKSet
let issuer; // expected issuer (iss claim)

export function initSupabaseJwks(supabaseUrl) {
  if (!supabaseUrl) throw new Error('SUPABASE_URL is required to initialize JWKS');
  const base = supabaseUrl.replace(/\/$/, '');
  const jwksUrl = `${base}/auth/v1/.well-known/jwks.json`;
  jwks = createRemoteJWKSet(new URL(jwksUrl));
  issuer = `${base}/auth/v1`;
}

// Factory that returns an Express middleware which validates incoming JWTs.
// options: { audience?: string }
export function supabaseAuthMiddleware(options = {}) {
  const { audience } = options;

  if (!jwks || !issuer) {
    throw new Error('supabaseAuth not initialized. Call initSupabaseJwks(SUPABASE_URL) on startup.');
  }

  return async function (req, res, next) {
    try {
      const auth = req.headers.authorization || '';
      if (!auth.startsWith('Bearer ')) return res.status(401).json({ error: 'Missing bearer token' });
      const token = auth.slice(7);

      // jwtVerify will fetch the appropriate key from JWKS and verify the signature.
      const { payload } = await jwtVerify(token, jwks, {
        issuer,
        audience: audience,
      });

      // Attach minimal user info to request for downstream handlers
      req.supabase = req.supabase || {};
      req.supabase.user = {
        id: payload.sub,
        email: payload.email,
        aud: payload.aud,
        iss: payload.iss,
        exp: payload.exp,
        raw: payload,
      };

      return next();
    } catch (err) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
  };
}
