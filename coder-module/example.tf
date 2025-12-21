terraform {
  required_providers {
    coder = {
      source = "coder/coder"
    }
  }
}

provider "coder" {}

data "coder_workspace" "me" {}
data "coder_workspace_owner" "me" {}

resource "coder_agent" "main" {
  os   = "linux"
  arch = "amd64"

  # Login shell
  login_shell = "/bin/bash"

  # Startup script
  startup_script = <<-EOT
    #!/bin/bash
    set -e

    # Install Node.js if not present
    if ! command -v node &> /dev/null; then
        curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
        sudo apt-get install -y nodejs
    fi
  EOT
}

# Use the webgit module
module "webgit" {
  source   = "."
  agent_id = coder_agent.main.id
  folder   = "/home/coder"  # Change to your desired git repository path
  share    = "owner"
  port     = 13340
}

# Example Docker container (optional)
resource "docker_container" "workspace" {
  count = data.coder_workspace.me.start_count
  image = "codercom/enterprise-node:ubuntu"
  name  = "coder-${data.coder_workspace_owner.me.name}-${lower(data.coder_workspace.me.name)}"

  # Use the docker gateway if the access URL is 127.0.0.1
  entrypoint = ["sh", "-c", replace(coder_agent.main.init_script, "/localhost|127\\.0\\.0\\.1/", "host.docker.internal")]

  env = [
    "CODER_AGENT_TOKEN=${coder_agent.main.token}",
  ]

  host {
    host = "host.docker.internal"
    ip   = "host-gateway"
  }
}
