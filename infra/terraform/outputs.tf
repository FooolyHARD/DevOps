output "vm_external_ip" {
  description = "Public IPv4 address of the VM (use for SSH and HTTP access)."
  value       = yandex_compute_instance.vm.network_interface.0.nat_ip_address
}

output "vm_internal_ip" {
  description = "Private IPv4 address of the VM inside the VPC."
  value       = yandex_compute_instance.vm.network_interface.0.ip_address
}

output "ssh_command" {
  description = "Ready-to-paste SSH command for connecting to the VM."
  value       = "ssh ${var.ssh_user}@${yandex_compute_instance.vm.network_interface.0.nat_ip_address}"
}

output "registry_id" {
  description = "Yandex Container Registry ID. Images are pushed to cr.yandex/<registry_id>/<image>:<tag>."
  value       = yandex_container_registry.main.id
}

output "registry_endpoint" {
  description = "Container Registry endpoint to use as image prefix."
  value       = "cr.yandex/${yandex_container_registry.main.id}"
}
