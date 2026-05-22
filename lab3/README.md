# Lab 3 Kubernetes Deployment

Cloud: Yandex Cloud  
Registry: `cr.yandex/crp17lc6pgst1e690e9c`  
Cluster: `itmo-lab3-cluster`

Application URL: `http://158.160.244.137`<br>
Backend health URL: `http://158.160.244.137/health`<br>
Backend API URL: `http://158.160.244.137/api/v1`<br>
Grafana URL: `http://158.160.138.136`<br>
Grafana login: `admin` / `admin12345`

Yandex Cloud quota allows two Network Load Balancers in this folder. The app
uses one dynamic public LoadBalancer named `edge`: nginx routes `/` to frontend
and `/api` plus `/health` to backend. Grafana uses the second dynamic public
LoadBalancer. Backend and frontend services stay internal as `ClusterIP`.

## Build and push backend image

```bash
docker build -t cr.yandex/crp17lc6pgst1e690e9c/marine-toxicity-backend:latest ../backend
docker push cr.yandex/crp17lc6pgst1e690e9c/marine-toxicity-backend:latest
```

## Deploy

```bash
kubectl apply -f k8s/app.yaml
kubectl apply -f k8s/monitoring.yaml
```

Managed Kubernetes already includes Metrics Server. If `kubectl top nodes` does not work in another cluster, install it:

```bash
kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml
```

## Generate load

```bash
kubectl delete job backend-cpu-load -n lab3 --ignore-not-found
kubectl apply -f k8s/load-test.yaml
kubectl get hpa,pods -n lab3 -w
```

## Useful checks

```bash
kubectl get svc -n lab3
kubectl get svc -n monitoring
kubectl logs -n lab3 deploy/backend
curl http://$(kubectl get svc edge -n lab3 -o jsonpath='{.status.loadBalancer.ingress[0].ip}')/health
kubectl port-forward -n monitoring svc/prometheus 9090:9090
```

## CI secrets

The `docker-publish` job in `.github/workflows/ci.yml` expects:

```text
YC_SA_JSON=<authorized service account key JSON>
YC_REGISTRY_ID=crp17lc6pgst1e690e9c
```

## Cleanup

```bash
kubectl delete namespace lab3 monitoring
yc managed-kubernetes node-group delete itmo-lab3-nodes
yc managed-kubernetes cluster delete itmo-lab3-cluster
yc vpc subnet delete itmo-lab3-subnet-a
yc vpc route-table delete itmo-lab3-nat-routes
yc vpc gateway delete itmo-lab3-nat-gateway
yc vpc network delete itmo-lab3-network
```

## Срочное рекавери

```bash 
git switch lab3
yc config profile activate lab3-sa

yc vpc network create --name itmo-lab3-network

yc vpc subnet create \
  --name itmo-lab3-subnet-a \
  --network-name itmo-lab3-network \
  --zone ru-central1-a \
  --range 10.30.0.0/24

yc vpc gateway create \
  --name itmo-lab3-nat-gateway \
  --shared-egress-gateway

yc vpc route-table create \
  --name itmo-lab3-nat-routes \
  --network-name itmo-lab3-network \
  --route destination=0.0.0.0/0,gateway-name=itmo-lab3-nat-gateway

yc vpc subnet update itmo-lab3-subnet-a \
  --route-table-name itmo-lab3-nat-routes

yc managed-kubernetes cluster create itmo-lab3-cluster \
  --network-name itmo-lab3-network \
  --zone ru-central1-a \
  --subnet-name itmo-lab3-subnet-a \
  --public-ip \
  --release-channel regular \
  --service-account-id ajedlm283uobuucdfski \
  --node-service-account-id ajedlm283uobuucdfski \
  --cluster-ipv4-range 10.112.0.0/16 \
  --service-ipv4-range 10.96.0.0/16

yc managed-kubernetes node-group create itmo-lab3-nodes \
  --cluster-name itmo-lab3-cluster \
  --platform standard-v3 \
  --cores 2 \
  --memory 4G \
  --core-fraction 20 \
  --disk-type network-hdd \
  --disk-size 40G \
  --fixed-size 1 \
  --preemptible \
  --container-runtime containerd \
  --network-interface subnets=itmo-lab3-subnet-a,ipv4-address=auto

yc managed-kubernetes cluster get-credentials itmo-lab3-cluster --external --force

kubectl apply -f k8s/app.yaml
kubectl apply -f k8s/monitoring.yaml

kubectl get svc -n lab3
kubectl get svc -n monitoring

APP_IP=$(kubectl get svc edge -n lab3 -o jsonpath='{.status.loadBalancer.ingress[0].ip}')
GRAFANA_IP=$(kubectl get svc grafana -n monitoring -o jsonpath='{.status.loadBalancer.ingress[0].ip}')
echo "Application: http://${APP_IP}"
echo "Backend health: http://${APP_IP}/health"
echo "Grafana: http://${GRAFANA_IP}"

kubectl delete job backend-cpu-load -n lab3 --ignore-not-found
kubectl apply -f k8s/load-test.yaml
kubectl get hpa,pods -n lab3 -w
```
