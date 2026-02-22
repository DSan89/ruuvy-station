#!/bin/bash

# Script per fermare l'API leggendo il PID dal file api.pid

WORK_DIR=$(pwd)
PID_FILE="$WORK_DIR/api.pid"

if [ ! -f "$PID_FILE" ]; then
  echo "File PID non trovato: $PID_FILE"
  exit 1
fi

PID=$(cat "$PID_FILE")

if kill -0 $PID 2>/dev/null; then
  kill $PID
  echo "Processo API (PID $PID) terminato."
  rm "$PID_FILE"
else
  echo "Nessun processo trovato con PID $PID."
  rm "$PID_FILE"
fi
