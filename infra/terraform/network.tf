resource "yandex_vpc_network" "main" {
  name        = "marine-toxicity-network"
  description = "VPC network for marine-toxicity lab VM."
}

resource "yandex_vpc_subnet" "main" {
  name           = "marine-toxicity-subnet"
  description    = "Subnet for marine-toxicity lab VM."
  zone           = var.zone
  network_id     = yandex_vpc_network.main.id
  v4_cidr_blocks = ["10.10.10.0/24"]
}
