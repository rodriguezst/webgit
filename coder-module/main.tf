terraform {
  required_version = ">= 1.0"

  required_providers {
    coder = {
      source  = "coder/coder"
      version = ">= 0.17"
    }
  }
}

# agent id
variable "agent_id" {
  type        = string
  description = "The ID of a Coder agent."
}

variable "agent_name" {
  type        = string
  description = <<-EOF
  The name of the coder_agent resource. This is used in multi-agent templates.
  EOF
  default     = ""
}

variable "log_path" {
  type        = string
  description = "The path to write logs to."
  default     = "/tmp/webgit.log"
}

variable "port" {
  type        = number
  description = "The port to run webgit on."
  default     = 13340
  validation {
    condition     = var.port > 0 && var.port < 65536
    error_message = "Port must be between 1 and 65535."
  }
}

variable "folder" {
  type        = string
  description = "The git repository directory to serve. Default is home directory."
  default     = "~"
}

variable "share" {
  type        = string
  description = "The access level for the webgit app. Valid values are 'owner', 'authenticated', or 'public'."
  default     = "owner"
  validation {
    condition     = var.share == "owner" || var.share == "authenticated" || var.share == "public"
    error_message = "Share must be 'owner', 'authenticated', or 'public'."
  }
}

variable "slug" {
  type        = string
  description = "The slug for the resource."
  default     = "webgit"
}

variable "order" {
  type        = number
  description = "The order determines the position of app in the UI presentation."
  default     = null
}

variable "group" {
  type        = string
  description = "The group for organizing resources in the UI."
  default     = null
}

variable "subdomain" {
  type        = bool
  description = "Determines whether the app will be accessed via its own subdomain or whether it will be accessed via a path on Coder."
  default     = false
}

locals {
  agent_name = var.agent_name != "" ? var.agent_name : "coder"
  url = templatestring(
    "http://localhost:$${port}$${base_path}",
    {
      port      = var.port
      base_path = ""
    }
  )
  script_path = "${path.module}/run.sh"
}

resource "coder_script" "webgit" {
  agent_id     = var.agent_id
  display_name = "webgit"
  icon         = "/icon/git.svg"
  script = templatefile(local.script_path, {
    LOG_PATH : var.log_path,
    PORT : var.port,
    FOLDER : var.folder,
    SERVER_BASE_PATH : var.subdomain ? "/" : "/@${local.agent_name}/apps/${var.slug}/"
  })
  run_on_start = true
}

resource "coder_app" "webgit" {
  agent_id     = var.agent_id
  display_name = "webgit"
  slug         = var.slug
  url          = local.url
  icon         = "/icon/git.svg"
  subdomain    = var.subdomain
  share        = var.share
  order        = var.order

  healthcheck {
    url       = local.url
    interval  = 5
    threshold = 6
  }
}
