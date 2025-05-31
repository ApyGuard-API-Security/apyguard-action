# 🔒 ApyGuard GitHub Action

Run API vulnerability scans with [ApyGuard](https://www.apyguard.com) in your CI/CD pipeline.

## 🚀 What is ApyGuard?

ApyGuard is an automated API security scanner that checks your API endpoints for vulnerabilities, including the [OWASP API Top 10](https://owasp.org/www-project-api-security/).

## 📦 How This Action Works

This GitHub Action uses the ApyGuard Docker scanner to scan your **running API server** after code changes.

## 🛠️ Usage

```yaml
name: Run ApyGuard Scan

on: [push, pull_request]

jobs:
  scan:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Run ApyGuard API Scanner
        uses: apyguard/apyguard-action@v1
        with:
          api_key: ${{ secrets.APYGUARD_API_KEY }}
          task_id: "your-task-id"
