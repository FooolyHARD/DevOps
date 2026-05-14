# Lab 3 Kubernetes Deployment

Cloud: Yandex Cloud  
Registry: `cr.yandex/crp17lc6pgst1e690e9c`  
Cluster: `itmo-lab3-cluster`

Backend URL: `http://103.76.55.205/health`  
Frontend URL: `http://158.160.34.89:30813`  
Grafana URL: `http://111.88.150.105`  
Grafana login: `admin` / `admin12345`

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
yc managed-kubernetes cluster delete itmo-lab3-cluster
yc container registry delete itmo-lab3-registry
yc vpc subnet delete itmo-lab3-subnet-a
yc vpc network delete itmo-lab3-network
```
