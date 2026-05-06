import { NextRequest, NextResponse } from 'next/server';
import JSZip from 'jszip';
import { withAuth } from '@/lib/withAuth';
import { getAgentById } from '@/lib/agentStore';
import { recordAgentDownload } from '@/lib/agentWorkflow';
import { ensurePortalUser } from '@/lib/userSync';

const GITHUB_API_BASE = 'https://api.github.com';
const GITHUB_TOKEN =
  process.env.GITHUB_TOKEN ||
  process.env.GH_TOKEN ||
  process.env.GITHUB_PAT ||
  process.env.GIT_TOKEN ||
  '';

// Fetch file content from GitHub
async function fetchGithubFile(
  owner: string,
  repo: string,
  path: string,
  branch?: string
): Promise<string | null> {
  const url = new URL(`${GITHUB_API_BASE}/repos/${owner}/${repo}/contents/${path}`);
  if (branch) {
    url.searchParams.set('ref', branch);
  }
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
  path: string,
  branch?: string
): Promise<{ files: Array<{ name: string; path: string }>; dirs: string[] }> {
  const url = new URL(`${GITHUB_API_BASE}/repos/${owner}/${repo}/contents/${path}`);
  if (branch) {
    url.searchParams.set('ref', branch);
  }
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

async function fetchDirectoryFromBranchZip(
  owner: string,
  repo: string,
  branch: string,
  agentPath: string
): Promise<JSZip> {
  const zipUrl = `https://codeload.github.com/${owner}/${repo}/zip/refs/heads/${branch}`;
  const response = await fetch(zipUrl, {
    headers: GITHUB_TOKEN
      ? {
          Authorization: `token ${GITHUB_TOKEN}`,
        }
      : undefined,
  });

  if (!response.ok) {
    throw new Error(`Failed to download branch archive (${response.status})`);
  }

  const archive = await JSZip.loadAsync(await response.arrayBuffer());
  const outputZip = new JSZip();
  const normalizedPath = agentPath.replace(/^\/+|\/+$/g, '');
  const archivePrefix = `${repo}-${branch}/${normalizedPath}/`;

  const matchingFiles = Object.keys(archive.files).filter(
    (name) => !archive.files[name].dir && name.startsWith(archivePrefix)
  );

  for (const fileName of matchingFiles) {
    const relativePath = fileName.slice(archivePrefix.length);
    const content = await archive.files[fileName].async('uint8array');
    outputZip.file(relativePath, content);
  }

  if (matchingFiles.length === 0) {
    throw new Error('No files found in branch archive for the requested path');
  }

  return outputZip;
}

export const GET = withAuth(async (
  request: NextRequest,
  { params, user }: { params: Promise<{ id: string }>; user: { user_id: string } }
) => {
  try {
    await ensurePortalUser(user as { user_id: string; email: string; role: string });
    const { id: agentId } = await params;
    const purpose = request.nextUrl.searchParams.get('purpose')?.trim() || 'github_download';

    const agent = await getAgentById(agentId);
    if (!agent) {
      return NextResponse.json(
        { error: 'Agent not found' },
        { status: 404 }
      );
    }

    if (!agent.github_url?.trim()) {
      return NextResponse.json(
        { error: 'Skill is not published to GitHub yet.' },
        { status: 400 }
      );
    }

    // Parse GitHub URL: https://github.com/owner/repo/tree/branch/path
    // Example: https://github.com/Hariharahari/Agents/tree/main/org.sel.330879ba.v1
    const normalizedGithubUrl = agent.github_url.trim();
    const urlMatch = normalizedGithubUrl.match(
      /github\.com\/([^\/]+)\/([^\/]+?)(?:\/tree\/([^\/]+)\/(.+))?$/
    );
    if (!urlMatch) {
      console.error('Invalid GitHub URL format:', normalizedGithubUrl);
      return NextResponse.json(
        { error: 'Invalid GitHub URL format' },
        { status: 400 }
      );
    }

    const owner = urlMatch[1].trim();
    const repo = urlMatch[2].trim();
    const branch = (urlMatch[3] || 'main').trim();
    const agentPath = (urlMatch[4] || agentId).trim(); // Use path from URL or agent ID

    console.log(`Downloading agent from GitHub: ${owner}/${repo}/${branch}/${agentPath}`);

    // Create ZIP archive
    const zip = new JSZip();
    const filesAdded = new Set<string>();

    // Recursively fetch files from GitHub
    const fetchRecursive = async (dirPath: string, prefix: string = '') => {
      const { files, dirs } = await fetchGithubDirectory(owner, repo, dirPath, branch);

      // Add files to ZIP
      for (const file of files) {
        const content = await fetchGithubFile(owner, repo, file.path, branch);
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

    let zipBuffer: ArrayBuffer;
    if (filesAdded.size === 0) {
      console.warn(`GitHub contents API returned no files, falling back to branch archive for ${owner}/${repo}/${branch}/${agentPath}`);
      try {
        const fallbackZip = await fetchDirectoryFromBranchZip(owner, repo, branch, agentPath);
        zipBuffer = await fallbackZip.generateAsync({ type: 'arraybuffer' });
      } catch (fallbackError) {
        console.error(`No files found in GitHub path: ${owner}/${repo}/${agentPath}`, fallbackError);
        return NextResponse.json(
          {
            error: 'No files found in the published GitHub repository path.',
          },
          { status: 400 }
        );
      }
    } else {
      console.log(`Successfully fetched ${filesAdded.size} files from GitHub`);
      zipBuffer = await zip.generateAsync({ type: 'arraybuffer' });
    }

    await recordAgentDownload(agent['agent id'], agent.version, user.user_id, purpose);

    // Return ZIP file
    return new NextResponse(zipBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${agent.name.toLowerCase().replace(/\s+/g, '-')}-skill.zip"`,
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
});
