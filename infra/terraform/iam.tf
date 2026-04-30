resource "yandex_iam_service_account" "vm_puller" {
  name        = "vm-puller"
  description = "Service account attached to the VM. Used to pull images from Container Registry."
  folder_id   = var.folder_id
}

resource "yandex_resourcemanager_folder_iam_member" "vm_puller_cr" {
  folder_id = var.folder_id
  role      = "container-registry.images.puller"
  member    = "serviceAccount:${yandex_iam_service_account.vm_puller.id}"
}
