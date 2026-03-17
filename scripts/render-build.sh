#!/bin/bash
set -e

echo "=== Building backend ==="
pnpm --filter @workspace/api-server run build

echo "=== Building frontend ==="
pnpm --filter @workspace/ai-coder run build

echo "=== Copying frontend to server dist ==="
mkdir -p artifacts/api-server/dist/public

if [ -d "artifacts/ai-coder/dist/public" ]; then
  cp -r artifacts/ai-coder/dist/public/. artifacts/api-server/dist/public/
  echo "Frontend files copied successfully"
  ls -la artifacts/api-server/dist/public/
else
  echo "ERROR: Frontend build output not found at artifacts/ai-coder/dist/public"
  exit 1
fi

echo "=== Build complete ==="
