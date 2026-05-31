#!/usr/bin/env bash
set -euo pipefail

ARGOCD_VERSION="${ARGOCD_VERSION:-stable}"

kubectl create namespace argocd --dry-run=client -o yaml | kubectl apply -f -
kubectl apply \
  --server-side \
  --force-conflicts \
  -n argocd \
  -f "https://raw.githubusercontent.com/argoproj/argo-cd/${ARGOCD_VERSION}/manifests/install.yaml"

kubectl -n argocd rollout status deployment/argocd-server --timeout=300s
kubectl -n argocd rollout status deployment/argocd-repo-server --timeout=300s
kubectl -n argocd rollout status statefulset/argocd-application-controller --timeout=300s

kubectl apply -f lab4/k8s/argocd/project.yaml
kubectl apply -f lab4/k8s/argocd/application.yaml
kubectl apply -f lab4/k8s/argocd/security-application.yaml

echo "Argo CD is installed."
echo "Port-forward UI: kubectl port-forward -n argocd svc/argocd-server 8080:443"
echo "Initial password: kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath='{.data.password}' | base64 -d"
