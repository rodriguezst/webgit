import simpleGit from 'simple-git';
import { normalize, isAbsolute, relative } from 'path';

export function createGitAPI(repoPath) {
  const git = simpleGit(repoPath);

  // Validate file paths to prevent path traversal attacks
  function validateFilePaths(files) {
    if (!files) return;

    const fileArray = Array.isArray(files) ? files : [files];

    for (const file of fileArray) {
      if (typeof file !== 'string') {
        throw new Error('File path must be a string');
      }

      // Normalize the path to resolve any . or .. segments
      const normalizedPath = normalize(file);

      // Check for absolute paths
      if (isAbsolute(normalizedPath)) {
        throw new Error('Absolute paths are not allowed');
      }

      // Check for path traversal attempts
      if (normalizedPath.startsWith('..') || normalizedPath.includes('/..') || normalizedPath.includes('\\..')) {
        throw new Error('Path traversal attempts are not allowed');
      }

      // Additional check: ensure the relative path doesn't escape the repo
      const resolvedPath = relative(repoPath, normalize(`${repoPath}/${normalizedPath}`));
      if (resolvedPath.startsWith('..')) {
        throw new Error('Path must be within the repository');
      }
    }
  }

  return {
    async getStatus() {
      const status = await git.status();
      const isRepo = await git.checkIsRepo();

      if (!isRepo) {
        throw new Error('Not a git repository');
      }

      // Get ahead/behind info
      let ahead = 0;
      let behind = 0;

      if (status.tracking) {
        try {
          const log = await git.log([`${status.tracking}..HEAD`]);
          ahead = log.total;
        } catch (e) {
          // Remote branch might not exist
        }

        try {
          const log = await git.log([`HEAD..${status.tracking}`]);
          behind = log.total;
        } catch (e) {
          // Remote branch might not exist
        }
      }

      return {
        current: status.current,
        tracking: status.tracking,
        ahead,
        behind,
        files: {
          modified: status.modified,
          added: status.created,
          deleted: status.deleted,
          untracked: status.not_added,
          staged: status.staged,
          renamed: status.renamed,
          conflicted: status.conflicted
        },
        isClean: status.isClean()
      };
    },

    async getBranches() {
      const summary = await git.branchLocal();
      const remoteBranches = await git.branch(['-r']);

      return {
        current: summary.current,
        local: summary.all,
        remote: remoteBranches.all
      };
    },

    async createBranch(name, checkout = false) {
      if (checkout) {
        await git.checkoutLocalBranch(name);
      } else {
        await git.branch([name]);
      }
      return { success: true, branch: name };
    },

    async checkoutBranch(branch) {
      await git.checkout(branch);
      return { success: true, branch };
    },

    async deleteBranch(name) {
      await git.deleteLocalBranch(name);
      return { success: true, branch: name };
    },

    async getCommitHistory(limit = 50) {
      try {
        const log = await git.log({ maxCount: limit });
        return log.all.map(commit => ({
          hash: commit.hash,
          shortHash: commit.hash.substring(0, 7),
          message: commit.message,
          author: commit.author_name,
          email: commit.author_email,
          date: commit.date,
          refs: commit.refs
        }));
      } catch (e) {
        // Repository might have no commits
        return [];
      }
    },

    async getCommitDetails(hash) {
      // Use command-line style arguments to get a specific commit by hash
      const log = await git.log(['-1', hash]);
      const commit = log.latest;

      if (!commit) {
        throw new Error('Commit not found');
      }

      const diff = await git.diff([`${hash}^..${hash}`]).catch(() =>
        git.show([hash, '--format=']) // For first commit, use git show
      );

      const show = await git.show([hash, '--stat', '--name-status']);

      return {
        hash: commit.hash,
        shortHash: commit.hash.substring(0, 7),
        message: commit.message,
        author: commit.author_name,
        email: commit.author_email,
        date: commit.date,
        diff,
        stats: show
      };
    },

    async getDiff(file, staged = false) {
      if (file) {
        validateFilePaths(file);
      }
      const args = staged ? ['--cached'] : [];
      if (file) {
        args.push('--', file);
      }
      return await git.diff(args);
    },

    async stageFiles(files) {
      if (files && files.length > 0) {
        validateFilePaths(files);
        await git.add(files);
      } else {
        await git.add('.');
      }
      return { success: true };
    },

    async unstageFiles(files) {
      if (files && files.length > 0) {
        validateFilePaths(files);
        await git.reset(['HEAD', '--', ...files]);
      } else {
        await git.reset(['HEAD']);
      }
      return { success: true };
    },

    async commit(message) {
      const result = await git.commit(message);
      return {
        success: true,
        commit: result.commit,
        summary: result.summary
      };
    },

    async discardChanges(files) {
      if (files && files.length > 0) {
        validateFilePaths(files);
        await git.checkout(['--', ...files]);
      } else {
        await git.checkout(['--', '.']);
      }
      return { success: true };
    },

    async getRemotes() {
      const remotes = await git.getRemotes(true);
      return remotes.map(remote => ({
        name: remote.name,
        fetchUrl: remote.refs.fetch,
        pushUrl: remote.refs.push
      }));
    },

    async fetch() {
      await git.fetch();
      return { success: true };
    },

    async pull(rebase = false) {
      const options = rebase ? { '--rebase': null } : {};
      const result = await git.pull(options);
      return { success: true, result };
    },

    async push(force = false, setUpstream = false) {
      const options = [];
      if (force) options.push('--force');
      if (setUpstream) {
        const status = await git.status();
        options.push('-u', 'origin', status.current);
      }
      await git.push(options);
      return { success: true };
    },

    async getConfig() {
      const config = await git.listConfig();
      const userName = config.all['user.name'] || '';
      const userEmail = config.all['user.email'] || '';
      const defaultBranch = config.all['init.defaultbranch'] || 'main';

      return {
        userName,
        userEmail,
        defaultBranch
      };
    },

    async setConfig(key, value) {
      // Whitelist of allowed config keys to prevent command injection
      const allowedKeys = [
        'user.name',
        'user.email',
        'init.defaultbranch'
      ];

      if (!allowedKeys.includes(key)) {
        throw new Error(`Configuration key '${key}' is not allowed. Allowed keys: ${allowedKeys.join(', ')}`);
      }

      // Validate value is a non-empty string
      if (typeof value !== 'string' || value.trim().length === 0) {
        throw new Error('Configuration value must be a non-empty string');
      }

      await git.addConfig(key, value);
      return { success: true };
    }
  };
}
