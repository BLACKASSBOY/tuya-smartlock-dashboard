#!/bin/bash

# Push to GitHub (Railway watches this)
git add .
git commit -m "Deploy: Fix Nixpacks builder configuration" || true
git push origin main

echo "✅ Pushed to GitHub. Railway should auto-deploy with Nixpacks builder."
echo "Check your Railway dashboard for deployment status."
