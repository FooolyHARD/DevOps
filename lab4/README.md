# Lab 4 Security and CD

Lab 4 adds a security gate and GitOps delivery on top of the Kubernetes setup
from Lab 3.

## What is included

- SonarQube in Kubernetes namespace `security`.
- SonarQube CI job with Quality Gate waiting enabled.
- Coverage gate: backend and frontend coverage must stay at least 80%.
- Docker image publishing to Yandex Container Registry for both backend and frontend.
- GitOps deployment: CI updates image tags in `lab4/k8s/app/app.yaml`; Argo CD syncs the cluster from branch `lab4`.
- Telegram CI/CD status notifications.

## Public endpoints

The folder quota allows two Yandex Network Load Balancers. The app keeps the
same shape as Lab 3:

- app edge LoadBalancer: `/` -> frontend, `/api` and `/health` -> backend
- Grafana LoadBalancer

SonarQube is exposed through the app edge as `/sonar`, so it does not consume a
third LoadBalancer.

```bash
APP_IP=$(kubectl get svc edge -n lab3 -o jsonpath='{.status.loadBalancer.ingress[0].ip}')
GRAFANA_IP=$(kubectl get svc grafana -n monitoring -o jsonpath='{.status.loadBalancer.ingress[0].ip}')

echo "Application: http://${APP_IP}"
echo "Backend health: http://${APP_IP}/health"
echo "SonarQube: http://${APP_IP}/sonar"
echo "Grafana: http://${GRAFANA_IP}"
```

## Bootstrap Argo CD

```bash
./lab4/scripts/bootstrap-argocd.sh
```

Useful Argo CD checks:

```bash
kubectl get applications -n argocd
kubectl describe application marine-toxicity-lab4 -n argocd
kubectl describe application marine-toxicity-security -n argocd
kubectl port-forward -n argocd svc/argocd-server 8080:443
```

## Bootstrap SonarQube

Argo CD deploys SonarQube from `lab4/k8s/security`. First login is
`admin` / `admin`; SonarQube will ask to change the password.

Create a SonarQube token for CI, then configure the project Quality Gate:

```bash
export SONAR_HOST_URL="http://${APP_IP}/sonar"
export SONAR_TOKEN="<sonarqube-token>"
./lab4/scripts/configure-sonarqube-quality-gate.sh
```

The configured gate fails on:

- new-code coverage below 80%
- any new SonarQube issues
- reviewed new security hotspots below 100%

The CI also enforces total project coverage locally before the scan:
`pytest --cov-fail-under=80` for backend and Vitest coverage thresholds for
frontend.

## GitHub Actions secrets

```text
YC_SA_JSON=<authorized Yandex Cloud service account key JSON>
YC_REGISTRY_ID=crp17lc6pgst1e690e9c
SONAR_HOST_URL=http://<app-edge-ip>/sonar
SONAR_TOKEN=<sonarqube-token>
TELEGRAM_BOT_TOKEN=<telegram-bot-token>
TELEGRAM_CHAT_ID=<telegram-chat-id>
```

## CI/CD flow

1. `backend-test` and `frontend-test` run tests and coverage.
2. `sonarqube-quality-gate` regenerates coverage, runs SonarQube scan, and waits for Quality Gate.
3. `docker-publish` builds and pushes `latest` and `${GITHUB_SHA}` images.
4. `gitops-deploy` updates image tags in Git and pushes a `[skip ci]` commit.
5. Argo CD auto-syncs the new manifests into the cluster.
6. `telegram-pipeline-status` sends job results to Telegram.

## Manual checks

```bash
curl "http://${APP_IP}/health"
curl -I "http://${APP_IP}/"
curl -I "http://${APP_IP}/sonar"

kubectl get svc,pods,hpa -n lab3
kubectl get pods -n security
kubectl get pods -n argocd
```
