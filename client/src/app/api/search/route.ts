import { NextRequest, NextResponse } from 'next/server';

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const YOUTUBE_API_URL = 'https://www.googleapis.com/youtube/v3/search';

interface YouTubeSearchItem {
  id: { videoId: string };
  snippet: {
    title: string;
    channelTitle: string;
    thumbnails: {
      default: { url: string };
      medium: { url: string };
    };
  };
}

interface SearchResult {
  videoId: string;
  title: string;
  channel: string;
  thumbnail: string;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q');

  if (!query) {
    return NextResponse.json({ error: 'Query parameter "q" is required' }, { status: 400 });
  }

  if (!YOUTUBE_API_KEY) {
    console.error('[API] YouTube API key not configured');
    return NextResponse.json({ error: 'Search service unavailable' }, { status: 500 });
  }

  try {
    const url = new URL(YOUTUBE_API_URL);
    url.searchParams.set('part', 'snippet');
    url.searchParams.set('q', query);
    url.searchParams.set('type', 'video');
    url.searchParams.set('videoCategoryId', '10'); // Music category
    url.searchParams.set('maxResults', '8');
    url.searchParams.set('key', YOUTUBE_API_KEY);

    const response = await fetch(url.toString());
    
    if (!response.ok) {
      const error = await response.json();
      console.error('[API] YouTube API error:', error);
      return NextResponse.json({ error: 'Search failed' }, { status: response.status });
    }

    const data = await response.json();
    
    const results: SearchResult[] = data.items
      .filter((item: YouTubeSearchItem) => item.id.videoId)
      .map((item: YouTubeSearchItem) => ({
        videoId: item.id.videoId,
        title: decodeHTMLEntities(item.snippet.title),
        channel: item.snippet.channelTitle,
        thumbnail: item.snippet.thumbnails.medium?.url || item.snippet.thumbnails.default?.url,
      }));

    return NextResponse.json({ results });
  } catch (error) {
    console.error('[API] Search error:', error);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}

// Decode HTML entities from YouTube API responses
function decodeHTMLEntities(text: string): string {
  const entities: Record<string, string> = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&apos;': "'",
  };
  return text.replace(/&[^;]+;/g, (entity) => entities[entity] || entity);
}
