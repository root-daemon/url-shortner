import { Elysia, Context, t } from 'elysia';
import { nanoid } from 'nanoid';
import { Buffer } from 'buffer';

const app = new Elysia();

const PORT = process.env.PORT || 3000;

// In-memory storage for URL mappings
const urlMappings: Record<string, string> = {};

// Simple user authentication data
const users: Record<string, string> = {
  user1: 'password1',
  user2: 'password2',
};

// Authentication Plugin
const authPlugin = () => ({
  // Apply authentication only to the '/shorten' route
  async onRequest(ctx: Context) {
    if (ctx.request.url === '/shorten') {
      const authHeader = ctx.request.headers.get('authorization');

      if (authHeader && authHeader.startsWith('Basic ')) {
        const base64Credentials = authHeader.slice(6);
        const credentials = Buffer.from(base64Credentials, 'base64').toString('utf-8');
        const [username, password] = credentials.split(':');

        if (users[username] === password) {
          // Authentication successful
          return;
        }
      }

      // Authentication failed
      return new Response('Unauthorized', { status: 401 });
    }
  },
});

app.use(authPlugin());

// Route to shorten URL (requires authentication)
app.post(
  '/shorten',
  async (ctx: Context) => {
    let body;
    try {
      body = await ctx.request.json();
    } catch {
      return new Response('Invalid JSON', { status: 400 });
    }

    const url = body.url;

    if (!url) {
      return new Response('Bad Request: URL is required.', { status: 400 });
    }

    const shortCode = nanoid(6);
    urlMappings[shortCode] = url;

    return Response.json({ shortUrl: `http://localhost:${PORT}/${shortCode}` });
  }
);

// Route to redirect
app.get('/:code', (ctx: Context<{ params: { code: string } }>) => {
  const code = ctx.params.code;
  const url = urlMappings[code];

  if (url) {
    return new Response(null, {
      status: 302,
      headers: { Location: url },
    });
  } else {
    return new Response('Not Found', { status: 404 });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server is running at http://localhost:${PORT}`);
});
