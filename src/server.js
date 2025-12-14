import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createGitAPI } from './git.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const REPO_PATH = process.env.REPO_PATH || process.cwd();

app.use(express.json());
app.use(express.static(join(__dirname, '../public')));

// Create git API
const gitAPI = createGitAPI(REPO_PATH);

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

app.post('/api/branches', async (req, res) => {
  try {
    const { name, checkout } = req.body;
    const result = await gitAPI.createBranch(name, checkout);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/branches/checkout', async (req, res) => {
  try {
    const { branch } = req.body;
    const result = await gitAPI.checkoutBranch(branch);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/branches/:name', async (req, res) => {
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

app.post('/api/stage', async (req, res) => {
  try {
    const { files } = req.body;
    const result = await gitAPI.stageFiles(files);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/unstage', async (req, res) => {
  try {
    const { files } = req.body;
    const result = await gitAPI.unstageFiles(files);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/commit', async (req, res) => {
  try {
    const { message } = req.body;
    const result = await gitAPI.commit(message);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/discard', async (req, res) => {
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

app.post('/api/fetch', async (req, res) => {
  try {
    const result = await gitAPI.fetch();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/pull', async (req, res) => {
  try {
    const { rebase } = req.body;
    const result = await gitAPI.pull(rebase);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/push', async (req, res) => {
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

app.post('/api/config', async (req, res) => {
  try {
    const { key, value } = req.body;
    const result = await gitAPI.setConfig(key, value);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`WebGit server running at http://localhost:${PORT}`);
  console.log(`Repository: ${REPO_PATH}`);
});
