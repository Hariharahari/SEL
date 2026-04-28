import { NextRequest, NextResponse } from 'next/server';
import redis from '@/lib/redis';
import { SELAgentCard } from '@/types';
import JSZip from 'jszip';

const GITHUB_API_BASE = 'https://api.github.com';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

/**
 * Verify Authorization header
 * Requires: Authorization: Bearer {access_token}
 * @returns true if valid, false otherwise
 */
function verifyAuthorizationHeader(request: NextRequest): boolean {
  const authHeader = request.headers.get('Authorization');
  
  if (!authHeader) {
    return false;
  }

  if (!authHeader.startsWith('Bearer ')) {
    return false;
  }

  const token = authHeader.substring(7); // Remove 'Bearer ' prefix
  
  // Basic token validation
  if (!token || token.length < 10) {
    return false;
  }

  // Check for JWT-like format (should have 3 parts separated by dots)
  const parts = token.split('.');
  if (parts.length !== 3) {
    return false;
  }

  return true;
}

// Fetch file content from GitHub
async function fetchGithubFile(
  owner: string,
  repo: string,
  path: string
): Promise<string | null> {
  const url = `${GITHUB_API_BASE}/repos/${owner}/${repo}/contents/${path}`;
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github.v3.raw',
  };

  if (GITHUB_TOKEN) {
    headers.Authorization = `token ${GITHUB_TOKEN}`;
  }

  try {
    const response = await fetch(url, { headers });
    if (!response.ok) {
      console.error(`Failed to fetch ${path}: ${response.status}`);
      return null;
    }
    return await response.text();
  } catch (error) {
    console.error(`Error fetching file ${path}:`, error);
    return null;
  }
}

// Fetch directory structure from GitHub
async function fetchGithubDirectory(
  owner: string,
  repo: string,
  path: string
): Promise<{ files: Array<{ name: string; path: string }>; dirs: string[] }> {
  const url = `${GITHUB_API_BASE}/repos/${owner}/${repo}/contents/${path}`;
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github.v3+json',
  };

  if (GITHUB_TOKEN) {
    headers.Authorization = `token ${GITHUB_TOKEN}`;
  }

  try {
    const response = await fetch(url, { headers });
    if (!response.ok) {
      console.error(`Failed to fetch directory ${path}: ${response.status}`);
      return { files: [], dirs: [] };
    }

    const data = await response.json();
    if (!Array.isArray(data)) {
      return { files: [], dirs: [] };
    }

    const files: Array<{ name: string; path: string }> = [];
    const dirs: string[] = [];

    for (const item of data) {
      if (item.type === 'file') {
        files.push({ name: item.name, path: item.path });
      } else if (item.type === 'dir' && !item.name.startsWith('.')) {
        dirs.push(item.path);
      }
    }

    return { files, dirs };
  } catch (error) {
    console.error(`Error fetching directory ${path}:`, error);
    return { files: [], dirs: [] };
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // **SECURITY: Verify Authorization header first**
    if (!verifyAuthorizationHeader(request)) {
      return NextResponse.json(
        {
          detail: 'Missing or invalid Authorization header',
          error: 'AuthenticationError'
        },
        { status: 401 }
      );
    }

    const { id: agentId } = await params;

    // Get agent from Redis
    const agentJson = await redis.hget('agents_catalog', agentId);
    if (!agentJson) {
      return NextResponse.json(
        { error: 'Agent not found' },
        { status: 404 }
      );
    }

    const agent: SELAgentCard = JSON.parse(agentJson);
    if (!agent.github_url) {
      return NextResponse.json(
        { error: 'Agent does not have a GitHub URL' },
        { status: 400 }
      );
    }

    // Parse GitHub URL: https://github.com/owner/repo/tree/branch/path
    // Example: https://github.com/Hariharahari/Agents/tree/main/org.sel.330879ba.v1
    const urlMatch = agent.github_url.match(
      /github\.com\/([^\/]+)\/([^\/]+?)(?:\/tree\/([^\/]+)\/(.+))?$/
    );
    if (!urlMatch) {
      console.error('Invalid GitHub URL format:', agent.github_url);
      return NextResponse.json(
        { error: 'Invalid GitHub URL format' },
        { status: 400 }
      );
    }

    const owner = urlMatch[1];
    const repo = urlMatch[2];
    const agentPath = urlMatch[4] || agentId; // Use path from URL or agent ID

    console.log(`Downloading agent from GitHub: ${owner}/${repo}/${agentPath}`);

    // Create ZIP archive
    const zip = new JSZip();
    const filesAdded = new Set<string>();

    // Recursively fetch files from GitHub
    const fetchRecursive = async (dirPath: string, prefix: string = '') => {
      const { files, dirs } = await fetchGithubDirectory(owner, repo, dirPath);

      // Add files to ZIP
      for (const file of files) {
        const content = await fetchGithubFile(owner, repo, file.path);
        if (content) {
          const relativePath = prefix ? `${prefix}/${file.name}` : file.name;
          zip.file(relativePath, content);
          filesAdded.add(relativePath);
        }
      }

      // Recursively fetch subdirectories
      for (const dir of dirs) {
        const dirName = dir.split('/').pop() || '';
        const newPrefix = prefix ? `${prefix}/${dirName}` : dirName;
        await fetchRecursive(dir, newPrefix);
      }
    };

    // Start recursive fetch from agent directory
    await fetchRecursive(agentPath);

    // If no files were added, return error
    if (filesAdded.size === 0) {
      console.error(`No files found in GitHub path: ${owner}/${repo}/${agentPath}`);
      return NextResponse.json(
        { error: 'No files found in repository' },
        { status: 400 }
      );
    }

    console.log(`Successfully fetched ${filesAdded.size} files from GitHub`);

    // Generate ZIP
    const zipBuffer = await zip.generateAsync({ type: 'arraybuffer' });

    // Return ZIP file
    return new NextResponse(zipBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${agent.name.toLowerCase().replace(/\s+/g, '-')}-agent.zip"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    console.error('Error in download-github:', error);
    return NextResponse.json(
      { error: 'Failed to download agent from GitHub' },
      { status: 500 }
    );
  }
}
