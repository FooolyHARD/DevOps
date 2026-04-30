variable "service_account_key_file" {
  description = "Path to authorized key JSON of the service account used by Terraform."
  type        = string
}

variable "cloud_id" {
  description = "Yandex Cloud ID."
  type        = string
}

variable "folder_id" {
  description = "Yandex Cloud folder ID where resources will be created."
  type        = string
}

variable "zone" {
  description = "Yandex Cloud zone for VM and subnet."
  type        = string
  default     = "ru-central1-a"
}

variable "vm_name" {
  description = "Name of the compute instance."
  type        = string
  default     = "marine-toxicity-vm"
}

variable "vm_cores" {
  description = "Number of vCPU cores."
  type        = number
  default     = 2
}

variable "vm_memory" {
  description = "Amount of RAM in GB."
  type        = number
  default     = 2
}

variable "vm_core_fraction" {
  description = "Guaranteed vCPU performance share (20 = burstable, 100 = full)."
  type        = number
  default     = 20
}

variable "vm_disk_size" {
  description = "Boot disk size in GB."
  type        = number
  default     = 20
}

variable "vm_image_family" {
  description = "Yandex Cloud image family for the boot disk."
  type        = string
  default     = "ubuntu-2204-lts"
}

variable "ssh_user" {
  description = "Default Linux user created on the VM."
  type        = string
  default     = "ubuntu"
}

variable "ssh_public_key_path" {
  description = "Path to the SSH public key that will be injected into the VM via cloud-init."
  type        = string
  default     = "~/.ssh/id_ed25519.pub"
}

variable "registry_name" {
  description = "Yandex Container Registry name."
  type        = string
  default     = "marine-toxicity-registry"
}

variable "preemptible" {
  description = "Whether the VM is preemptible (cheaper, can be stopped by Yandex Cloud)."
  type        = bool
  default     = true
}
