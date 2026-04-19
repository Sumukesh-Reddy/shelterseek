# CI/CD Pipeline Implementation Plan

This plan outlines the steps to configure automated deployment for the ShelterSeek application.

## Goals
- Automate Backend deployment to **Render**.
- Automate Frontend deployment to **Vercel**.
- Ensure tests pass before any deployment occurs.

## Components
1. **GitHub Actions Workflow**: Update `.github/workflows/ci.yml` to trigger deployments on push to `main` branch.
2. **Render Integration**: Use the Render Deploy Hook API to trigger a new build.
3. **Vercel Integration**: Use the official Vercel GitHub Action for deployment.

## Required Secrets (GitHub Settings)
To make this work, you must add the following secrets to your GitHub repository (**Settings > Secrets and variables > Actions**):

### For backend (Render)
- `RENDER_API_KEY`: Your Render API key or the `key` parameter from your Deploy Hook.
- `RENDER_SERVICE_ID`: The ID of your Render service (found in the service settings URL, starts with `srv-`).

### For frontend (Vercel)
- `VERCEL_TOKEN`: Your Vercel Personal Access Token.
- `VERCEL_ORG_ID`: Your Vercel Organization ID (found in team settings).
- `VERCEL_PROJECT_ID`: Your Vercel Project ID (found in project settings).

## Workflow Changes
- [x] Updated `.github/workflows/ci.yml`.
- [x] Configured `deploy-production` job to use Render and Vercel actions.
- [x] Linked deployment status to successful test completion.
