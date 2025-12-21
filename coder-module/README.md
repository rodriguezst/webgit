# webgit Coder Module

A Coder module for integrating [webgit](https://www.npmjs.com/package/@rodriguezst_/webgit) - a standalone Git viewer web client that allows you to browse your git repositories from the browser.

## Features

- Browse git repository history, branches, commits, and files
- View diffs and file contents
- Automatic installation via npm
- Configurable port and repository path
- Health checks for reliability
- Support for subdomain or path-based access

## Usage

Add this module to your Coder template:

```hcl
module "webgit" {
  source   = "./coder-module"
  agent_id = coder_agent.main.id
  folder   = "/home/coder/project"  # Path to your git repository
}
```

## Variables

| Name | Description | Type | Default | Required |
|------|-------------|------|---------|----------|
| `agent_id` | The ID of a Coder agent | `string` | - | yes |
| `agent_name` | The name of the coder_agent resource (for multi-agent templates) | `string` | `""` | no |
| `log_path` | The path to write logs to | `string` | `"/tmp/webgit.log"` | no |
| `port` | The port to run webgit on | `number` | `13340` | no |
| `folder` | The git repository directory to serve | `string` | `"~"` | no |
| `share` | Access level: 'owner', 'authenticated', or 'public' | `string` | `"owner"` | no |
| `slug` | The slug for the resource | `string` | `"webgit"` | no |
| `order` | Position of app in UI presentation | `number` | `null` | no |
| `group` | Group for organizing resources in UI | `string` | `null` | no |
| `subdomain` | Access via subdomain (true) or path (false) | `bool` | `false` | no |

## Examples

### Basic Usage

```hcl
module "webgit" {
  source   = "./coder-module"
  agent_id = coder_agent.main.id
}
```

### Custom Configuration

```hcl
module "webgit" {
  source     = "./coder-module"
  agent_id   = coder_agent.main.id
  folder     = "/workspace/my-project"
  port       = 8080
  share      = "authenticated"
  subdomain  = true
}
```

### Multi-Agent Template

```hcl
module "webgit" {
  source     = "./coder-module"
  agent_id   = coder_agent.dev.id
  agent_name = "dev"
  folder     = "/home/coder/repos"
  slug       = "git-viewer"
}
```

## Requirements

- Coder provider >= 0.17
- Terraform >= 1.0
- Node.js >= 18.0.0 (installed on the agent)
- npm (installed on the agent)
- A git repository in the specified folder

## Notes

- The module automatically installs `@rodriguezst_/webgit` globally via npm if not already installed
- If the specified folder is not a git repository, it will be initialized as one
- Logs are written to the path specified in `log_path`
- The app includes health checks every 5 seconds with a threshold of 6 attempts

## License

MIT
