# Play Count Tracking Setup

This feature tracks how many people have played each puzzle each day and displays the count in the UI.

## Frontend Implementation

The frontend code is already implemented. It includes:
- `js/play-count.js` - Module for tracking and retrieving play counts
- UI displays on puzzle pages, daily puzzle, and archive pages
- Automatic tracking when puzzles are completed

## Backend API Requirements

To enable play count tracking, you need to set up a simple backend API that handles two endpoints:

### 1. Record Play Endpoint
**POST** `/record`

**Request Body:**
```json
{
  "puzzleNumber": 1,
  "date": "2024-12-01"
}
```

**Response:** 
- Status: `200 OK` (or `201 Created`)
- Body: `{ "success": true }` (optional)

### 2. Get Count Endpoint
**GET** `/count?puzzleNumber=1&date=2024-12-01`

**Response:**
```json
{
  "count": 1234
}
```

## Backend Implementation Options

### Option 1: Cloudflare Workers (Recommended - Free Tier Available)

Create a Cloudflare Worker with KV storage:

1. **Create KV Namespace:**
   ```bash
   wrangler kv:namespace create PLAY_COUNTS
   wrangler kv:namespace create PLAY_COUNTS --preview
   ```

2. **worker.js:**
   ```javascript
   export default {
     async fetch(request, env) {
       const url = new URL(request.url);
       const path = url.pathname;
       
       // CORS headers
       const headers = {
         'Access-Control-Allow-Origin': '*',
         'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
         'Access-Control-Allow-Headers': 'Content-Type',
       };
       
       // Handle CORS preflight
       if (request.method === 'OPTIONS') {
         return new Response(null, { headers });
       }
       
       if (path === '/record' && request.method === 'POST') {
         const data = await request.json();
         const key = `${data.puzzleNumber}-${data.date}`;
         
         // Increment count (default to 0 if doesn't exist)
         const current = await env.PLAY_COUNTS.get(key) || '0';
         const newCount = parseInt(current) + 1;
         await env.PLAY_COUNTS.put(key, newCount.toString());
         
         return new Response(JSON.stringify({ success: true }), {
           headers: { ...headers, 'Content-Type': 'application/json' }
         });
       }
       
       if (path === '/count' && request.method === 'GET') {
         const puzzleNumber = url.searchParams.get('puzzleNumber');
         const date = url.searchParams.get('date');
         const key = `${puzzleNumber}-${date}`;
         
         const count = await env.PLAY_COUNTS.get(key) || '0';
         
         return new Response(JSON.stringify({ count: parseInt(count) }), {
           headers: { ...headers, 'Content-Type': 'application/json' }
         });
       }
       
       return new Response('Not Found', { status: 404, headers });
     }
   };
   ```

3. **wrangler.toml:**
   ```toml
   name = "play-count-api"
   main = "worker.js"
   compatibility_date = "2024-01-01"
   
   [[kv_namespaces]]
   binding = "PLAY_COUNTS"
   id = "your-kv-namespace-id"
   
   [[kv_namespaces]]
   binding = "PLAY_COUNTS"
   preview_id = "your-preview-kv-namespace-id"
   id = "your-preview-kv-namespace-id"
   ```

### Option 2: Vercel Serverless Functions (Free Tier Available)

1. **api/play-count.js:**
   ```javascript
   // Use Vercel KV (Upstash Redis) or a simple JSON file in a storage bucket
   import { kv } from '@vercel/kv';
   
   export default async function handler(req, res) {
     // CORS
     res.setHeader('Access-Control-Allow-Origin', '*');
     res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
     res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
     
     if (req.method === 'OPTIONS') {
       return res.status(200).end();
     }
     
     if (req.method === 'POST' && req.body.puzzleNumber && req.body.date) {
       const key = `${req.body.puzzleNumber}-${req.body.date}`;
       const current = await kv.get(key) || 0;
       await kv.set(key, current + 1);
       return res.json({ success: true });
     }
     
     if (req.method === 'GET' && req.query.puzzleNumber && req.query.date) {
       const key = `${req.query.puzzleNumber}-${req.query.date}`;
       const count = await kv.get(key) || 0;
       return res.json({ count });
     }
     
     return res.status(404).json({ error: 'Not found' });
   }
   ```

### Option 3: Netlify Functions (Free Tier Available)

Similar to Vercel, create a serverless function in the `netlify/functions` directory.

## Configuration

Once you have your backend API URL, configure it in your HTML files by adding this before the main script tag:

```html
<script>
  window.PLAY_COUNT_API_URL = 'https://your-api-url.com';
</script>
```

For example, in `index.html`, `puzzle.html`, and `archive.html`, add:

```html
<script>
  window.PLAY_COUNT_API_URL = 'https://your-worker.workers.dev';
</script>
<script type="module" src="script.js"></script>
```

## Testing

To test locally without a backend:
1. The frontend will show "0 players" if no API URL is configured
2. It will gracefully handle API errors without interrupting the user experience
3. You can test the API endpoints using curl:

```bash
# Record a play
curl -X POST https://your-api-url.com/record \
  -H "Content-Type: application/json" \
  -d '{"puzzleNumber": 1, "date": "2024-12-01"}'

# Get count
curl https://your-api-url.com/count?puzzleNumber=1&date=2024-12-01
```

## Privacy Considerations

- Play counts are aggregated and anonymous
- No personal information is collected
- Each play increments a counter for that puzzle/date combination
- The same user playing multiple times will increment the count multiple times (which may be desired behavior to show engagement)

If you want to track unique players instead, you would need to implement session tracking or use a different approach (e.g., IP hashing, local storage tokens, etc.).
