#!/usr/bin/env bash
# Gera o .zip para enviar à pasta public_html da HostGator.
set -euo pipefail
cd "$(dirname "$0")"
out="${1:-ofertas-ml-spgvale.zip}"
rm -f "$out"
zip -r -q "$out" index.html sobre.html privacidade.html products.json assets README.md -x '*.DS_Store'
echo "Gerado: $out"
