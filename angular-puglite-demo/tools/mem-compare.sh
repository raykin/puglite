#!/usr/bin/env bash
#
# Peak-memory + build-time comparison on this same app:
#   puglite   -> target `build`            (puglite:browser, webpack)
#   webdiscus -> target `build-webdiscus`  (@angular-builders/custom-webpack:browser, webpack)
#   esbuild   -> target `build-esbuild`    (@angular/build:application, stock esbuild, HTML twin, NO pug)
#
# The esbuild row is the baseline: same component graph rendered from HTML
# templates instead of pug, built by Angular's default esbuild builder. The
# gap between it and the two webpack rows is the true webpack-vs-esbuild cost.
#
# Each engine is built COLD (dist + .angular/cache wiped first) so the numbers
# reflect a full compile, then measured with /usr/bin/time -v. We report the
# kernel's "Maximum resident set size" (peak RSS) and wall-clock time.
#
# Usage:
#   tools/mem-compare.sh                  # production build (default)
#   tools/mem-compare.sh development      # dev build (optimization off)
#
# Tune corpus size first with:  npm run gen:components 200
#
# Note: ng build is a finite process, so peak RSS is clean and comparable.
# /usr/bin/time -v measures the main build process; if Angular forks worker
# processes their separate RSS is not summed — fine for an apples-to-apples
# delta since both engines fork the same way.

set -uo pipefail
cd "$(dirname "$0")/.." || exit 1

CONFIG="${1:-production}"
LOGDIR="$(mktemp -d)"
TIME_BIN="/usr/bin/time"

if [ ! -x "$TIME_BIN" ]; then
  echo "ERROR: $TIME_BIN not found (install GNU time: apt-get install time)" >&2
  exit 1
fi

run() {
  local name="$1" target="$2"
  local log="$LOGDIR/$name.log"
  echo ">> building $name ($target, $CONFIG) ..." >&2
  rm -rf dist .angular/cache 2>/dev/null

  "$TIME_BIN" -v npx ng run "angular-puglite-demo:${target}:${CONFIG}" >"$log" 2>&1
  local code=$?

  local rss_kb wall
  rss_kb=$(grep -oE "Maximum resident set size \(kbytes\): [0-9]+" "$log" | grep -oE "[0-9]+$")
  wall=$(grep -oE "Elapsed \(wall clock\).*" "$log" | sed -E 's/.*: //')

  if [ "$code" -ne 0 ]; then
    echo "   FAILED (exit $code). Compile error:" >&2
    grep -E "error TS|ERROR|Error:|✘|Module not found|Cannot" "$log" | grep -v "non-zero" | head -5 >&2
  fi

  # emit a parseable row: name|exit|rss_mb|wall
  local rss_mb="n/a"
  [ -n "$rss_kb" ] && rss_mb=$(awk "BEGIN{printf \"%.0f\", $rss_kb/1024}")
  echo "${name}|${code}|${rss_mb}|${wall:-n/a}"
}

echo "logs: $LOGDIR" >&2
ROW_PUGLITE=$(run puglite build)
ROW_WEBDISCUS=$(run webdiscus build-webdiscus)
ROW_ESBUILD=$(run esbuild build-esbuild)

printf '\n================  PEAK-MEMORY COMPARISON (%s, cold)  ================\n' "$CONFIG"
printf '%-12s %-8s %-14s %-12s\n' "engine" "exit" "peakRSS(MB)" "wall"
printf -- '-%.0s' {1..50}; printf '\n'
for row in "$ROW_PUGLITE" "$ROW_WEBDISCUS" "$ROW_ESBUILD"; do
  IFS='|' read -r name code rss wall <<<"$row"
  printf '%-12s %-8s %-14s %-12s\n' "$name" "$code" "$rss" "$wall"
done

IFS='|' read -r _ pc pr _ <<<"$ROW_PUGLITE"
IFS='|' read -r _ wc wr _ <<<"$ROW_WEBDISCUS"
IFS='|' read -r _ ec er _ <<<"$ROW_ESBUILD"
printf '\n'
if [ "$pc" = "0" ] && [ "$wc" = "0" ] && [ "$pr" != "n/a" ] && [ "$wr" != "n/a" ]; then
  awk "BEGIN{d=$pr-$wr; p=(d/$wr)*100; printf \"puglite vs webdiscus (loader): %+d MB (%+.1f%%)\n\", d, p}"
fi
if [ "$pc" = "0" ] && [ "$ec" = "0" ] && [ "$pr" != "n/a" ] && [ "$er" != "n/a" ]; then
  awk "BEGIN{d=$pr-$er; p=(d/$er)*100; printf \"puglite(webpack) vs stock esbuild (builder): %+d MB (%+.1f%%)\n\", d, p}"
fi
if [ "$pc" != "0" ] || [ "$wc" != "0" ] || [ "$ec" != "0" ]; then
  printf '(one or more builds failed — see logs above)\n'
fi
echo "full logs in: $LOGDIR"
