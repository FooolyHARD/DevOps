data "yandex_compute_image" "ubuntu" {
  family = var.vm_image_family
}

resource "yandex_compute_instance" "vm" {
  name               = var.vm_name
  hostname           = var.vm_name
  zone               = var.zone
  platform_id        = "standard-v3"
  service_account_id = yandex_iam_service_account.vm_puller.id

  depends_on = [yandex_resourcemanager_folder_iam_member.vm_puller_cr]

  resources {
    cores         = var.vm_cores
    memory        = var.vm_memory
    core_fraction = var.vm_core_fraction
  }

  boot_disk {
    initialize_params {
      image_id = data.yandex_compute_image.ubuntu.id
      size     = var.vm_disk_size
      type     = "network-hdd"
    }
  }

  network_interface {
    subnet_id = yandex_vpc_subnet.main.id
    nat       = true
  }

  scheduling_policy {
    preemptible = var.preemptible
  }

  metadata = {
    ssh-keys  = "${var.ssh_user}:${trimspace(file(pathexpand(var.ssh_public_key_path)))}"
    user-data = <<-EOT
      #cloud-config
      users:
        - name: ${var.ssh_user}
          sudo: ALL=(ALL) NOPASSWD:ALL
          shell: /bin/bash
          ssh_authorized_keys:
            - ${trimspace(file(pathexpand(var.ssh_public_key_path)))}
    EOT
  }
}
