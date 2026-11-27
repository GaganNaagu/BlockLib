#!/usr/bin/env bash
set -e

echo "Starting BlockLib Local Demo Environment..."
npm run node:blockchain &
BLOCKCHAIN_PID=$!

sleep 5
npm run demo:reset
npm run dev:api &
API_PID=$!

npm run dev:web &
WEB_PID=$!

echo "BlockLib running: Web http://localhost:5173 | API http://localhost:4000 | Hardhat http://127.0.0.1:8545"
trap "kill $BLOCKCHAIN_PID $API_PID $WEB_PID 2>/dev/null" EXIT
wait
