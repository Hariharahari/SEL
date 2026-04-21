import { NextRequest, NextResponse } from 'next/server';
import redis from '@/lib/redis';
import { SELAgentCard } from '@/types';
import JSZip from 'jszip';

const GITHUB_API_BASE = 'https://api.github.com';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

// File patterns to include based on technology
const FILE_PATTERNS = {
  python: {
    include: [/\.py$/, /requirements\.txt$/, /setup\.py$/, /pyproject\.toml$/, /\.md$/, /\.yaml$/, /\.yml$/, /\.json$/],
    exclude: [/^test_/, /tests\//],
  },
  javascript: {
    include: [/\.(js|ts|tsx|jsx)$/, /package\.json$/, /\.md$/, /\.yaml$/, /\.yml$/, /\.json$/],
    exclude: [/^test_/, /tests\//],
  },
};

function shouldIncludeFile(filename: string, technology: string[]): boolean {
  // Determine primary tech
  const isPython = technology.some(t => t.toLowerCase().includes('python'));
  const patterns = isPython ? FILE_PATTERNS.python : FILE_PATTERNS.javascript;

  const included = patterns.include.some(pattern => pattern.test(filename));
  const excluded = patterns.exclude.some(pattern => pattern.test(filename));

  return included && !excluded;
}

async function fetchGithubDirectory(
  owner: string,
  repo: string,
  path: string = '',
  technology: string[]
): Promise<{ files: Map<string, string>; dirs: string[] }> {
  const url = `${GITHUB_API_BASE}/repos/${owner}/${repo}/contents${path ? `/${path}` : ''}`;
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github.v3+raw',
  };

  if (GITHUB_TOKEN) {
    headers.Authorization = `token ${GITHUB_TOKEN}`;
  }

  try {
    const response = await fetch(url, { headers });
    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`);
    }

    const data = await response.json();
    if (!Array.isArray(data)) {
      return { files: new Map(), dirs: [] };
    }

    const files = new Map<string, string>();
    const dirs: string[] = [];

    for (const item of data) {
      if (item.type === 'file' && shouldIncludeFile(item.name, technology)) {
        files.set(item.path, item.download_url);
      } else if (item.type === 'dir' && !item.name.startsWith('.')) {
        dirs.push(item.path);
      }
    }

    return { files, dirs };
  } catch (error) {
    console.error('Error fetching GitHub directory:', error);
    return { files: new Map(), dirs: [] };
  }
}

async function downloadFileContent(downloadUrl: string): Promise<string> {
  try {
    const response = await fetch(downloadUrl);
    if (!response.ok) {
      throw new Error(`Failed to download file: ${response.status}`);
    }
    return await response.text();
  } catch (error) {
    console.error('Error downloading file:', error);
    return '';
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
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

    // Parse GitHub URL
    const githubMatch = agent.github_url.match(/github\.com\/([^\/]+)\/([^\/]+?)(?:\.git)?$/);
    if (!githubMatch) {
      return NextResponse.json(
        { error: 'Invalid GitHub URL format' },
        { status: 400 }
      );
    }

    const [, owner, repo] = githubMatch;

    // Create ZIP archive
    const zip = new JSZip();
    const filesAdded = new Set<string>();

    // Fetch root directory files
    const { files: rootFiles, dirs } = await fetchGithubDirectory(
      owner,
      repo,
      '',
      agent.technology
    );

    // Add root files
    for (const [filePath, downloadUrl] of rootFiles) {
      const content = await downloadFileContent(downloadUrl);
      if (content) {
        zip.file(filePath, content);
        filesAdded.add(filePath);
      }
    }

    // Recursively fetch subdirectories (config, schemas, etc.)
    const dirsToExplore = dirs.filter(
      d => ['config', 'schemas', 'src', 'lib', 'components'].includes(d.split('/').pop() || '')
    );

    for (const dir of dirsToExplore) {
      const { files: dirFiles } = await fetchGithubDirectory(
        owner,
        repo,
        dir,
        agent.technology
      );

      for (const [filePath, downloadUrl] of dirFiles) {
        const content = await downloadFileContent(downloadUrl);
        if (content && !filesAdded.has(filePath)) {
          zip.file(filePath, content);
          filesAdded.add(filePath);
        }
      }
    }

    // If no files were added, return error
    if (filesAdded.size === 0) {
      return NextResponse.json(
        { error: 'No compatible files found in repository' },
        { status: 400 }
      );
    }

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
