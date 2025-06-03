# 🔒 ApyGuard GitHub Action

Run API vulnerability scans with [ApyGuard](https://www.apyguard.com) in your CI/CD pipeline.

## 🚀 What is ApyGuard?

ApyGuard is an automated API security scanner that checks your API endpoints for vulnerabilities, including the [OWASP API Top 10](https://owasp.org/www-project-api-security/).

## 📦 How This Action Works

This GitHub Action uses the ApyGuard API to scan your **running API server** after code changes. The scan is performed remotely through the ApyGuard API service.

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
          task_id: "ApyGuard-Task-ID"
          api_url: "https://api.apyguard.com/v1"  # Optional, defaults to production URL
          severity_threshold: "Medium" # Optional, default value "Medium"
```

## 📝 Inputs

| Input | Required | Description |
|-------|----------|-------------|
| api_key | Yes | Your ApyGuard API token |
| task_id | Yes | The task ID from ApyGuard platform |
| api_url | No | Custom API endpoint URL (defaults to production) |

## 📤 Outputs

| Output | Description |
|--------|-------------|
| results | JSON string containing the scan results |
