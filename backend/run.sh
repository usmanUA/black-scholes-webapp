#!/bin/bash

set -e

SCENARIO="$1"
OUT_DIR="./data"
CPP_DIR="./cpp"
PLOT_DIR="./plot"

mkdir -p "$OUT_DIR"

echo "Building C++ project..."
g++ -O3 -std=c++17 "$CPP_DIR/main.cpp" -o "$CPP_DIR/bs_derivatives"

echo "Running scenario $SCENARIO..."
"$CPP_DIR/bs_derivatives" "$SCENARIO"

echo "Generating plot..."
python3 "$PLOT_DIR/plot_errors.py" "$OUT_DIR/bs_fd_vs_complex.csv" "$OUT_DIR/${SCENARIO}_plot.png"

echo "Done. Output plot in $OUT_DIR"
