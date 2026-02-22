#!/bin/bash

# Script per fermare main.js leggendo il PID dal file main.pid

WORK_DIR=$(pwd)
PID_FILE="$WORK_DIR/main.pid"

if [ ! -f "$PID_FILE" ]; then
  echo "File PID non trovato: $PID_FILE"
  exit 1
fi

PID=$(cat "$PID_FILE")

if kill -0 $PID 2>/dev/null; then
  kill $PID
  echo "Processo main.js (PID $PID) terminato."
  rm "$PID_FILE"
else
  echo "Nessun processo trovato con PID $PID."
  rm "$PID_FILE"
fi
