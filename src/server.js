import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join, basename } from 'path';
import { createGitAPI } from './git.js';
import { randomBytes } from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Start the WebGit server
 * @param {Object} options - Server options
 * @param {number} [options.port=3000] - Port to run the server on
 * @param {string} [options.repoPath=process.cwd()] - Path to the git repository
 * @param {boolean} [options.open=false] - Open browser automatically
 */
export function startServer(options = {}) {
  const port = options.port || process.env.PORT || 3000;
  const repoPath = options.repoPath || process.env.REPO_PATH || process.cwd();
  const repoName = basename(repoPath);

  const app = express();

  // Generate CSRF token for this session
  const csrfToken = randomBytes(32).toString('hex');

  app.use(express.json());
  app.use(express.static(join(__dirname, '../public')));

  // CSRF token endpoint
  app.get('/api/csrf-token', (req, res) => {
    res.json({ token: csrfToken });
  });

  // CSRF protection middleware for state-changing operations
  function csrfProtection(req, res, next) {
    const token = req.headers['x-csrf-token'];
    if (token !== csrfToken) {
      return res.status(403).json({ error: 'Invalid CSRF token' });
    }
    next();
  }

  // Create git API
  const gitAPI = createGitAPI(repoPath);

  // API Routes
  app.get('/api/status', async (req, res) => {
    try {
      const status = await gitAPI.getStatus();
      res.json(status);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/branches', async (req, res) => {
    try {
      const branches = await gitAPI.getBranches();
      res.json(branches);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/branches', csrfProtection, async (req, res) => {
    try {
      const { name, checkout } = req.body;
      const result = await gitAPI.createBranch(name, checkout);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/branches/checkout', csrfProtection, async (req, res) => {
    try {
      const { branch } = req.body;
      const result = await gitAPI.checkoutBranch(branch);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete('/api/branches/:name', csrfProtection, async (req, res) => {
    try {
      const result = await gitAPI.deleteBranch(req.params.name);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/commits', async (req, res) => {
    try {
      const limit = parseInt(req.query.limit) || 50;
      const commits = await gitAPI.getCommitHistory(limit);
      res.json(commits);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/commits/:hash', async (req, res) => {
    try {
      const commit = await gitAPI.getCommitDetails(req.params.hash);
      res.json(commit);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/diff', async (req, res) => {
    try {
      const { file, staged } = req.query;
      const diff = await gitAPI.getDiff(file, staged === 'true');
      res.json({ diff });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/stage', csrfProtection, async (req, res) => {
    try {
      const { files } = req.body;
      const result = await gitAPI.stageFiles(files);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/unstage', csrfProtection, async (req, res) => {
    try {
      const { files } = req.body;
      const result = await gitAPI.unstageFiles(files);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/commit', csrfProtection, async (req, res) => {
    try {
      const { message } = req.body;
      const result = await gitAPI.commit(message);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/discard', csrfProtection, async (req, res) => {
    try {
      const { files } = req.body;
      const result = await gitAPI.discardChanges(files);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/remotes', async (req, res) => {
    try {
      const remotes = await gitAPI.getRemotes();
      res.json(remotes);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/fetch', csrfProtection, async (req, res) => {
    try {
      const result = await gitAPI.fetch();
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/pull', csrfProtection, async (req, res) => {
    try {
      const { rebase } = req.body;
      const result = await gitAPI.pull(rebase);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/push', csrfProtection, async (req, res) => {
    try {
      const { force, setUpstream } = req.body;
      const result = await gitAPI.push(force, setUpstream);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/config', async (req, res) => {
    try {
      const config = await gitAPI.getConfig();
      res.json(config);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/config', csrfProtection, async (req, res) => {
    try {
      const { key, value } = req.body;
      const result = await gitAPI.setConfig(key, value);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  const server = app.listen(port, '127.0.0.1', () => {
    const url = `http://localhost:${port}`;
    console.log(`\n  WebGit - Git Repository Viewer\n`);
    console.log(`  Repository: ${repoName}`);
    console.log(`  Path:       ${repoPath}`);
    console.log(`  Server:     ${url}`);
    console.log(`  Listening:  127.0.0.1 only\n`);

    // Open browser if requested
    if (options.open) {
      import('child_process').then(({ exec }) => {
        const platform = process.platform;
        const cmd = platform === 'darwin' ? 'open' :
                    platform === 'win32' ? 'start' : 'xdg-open';
        exec(`${cmd} ${url}`);
      });
    }
  });

  return server;
}

// Allow direct execution for backward compatibility
const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  startServer();
}
