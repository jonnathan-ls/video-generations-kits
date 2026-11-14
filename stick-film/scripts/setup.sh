#!/usr/bin/env bash
# Checks (and with --install, sets up) everything the stick-film skill needs. Safe to run again.
# Installs only into the workspace ($STICKFILM_HOME/.tools): a Python venv, playwright-core, the Kokoro voice model.
# System tools (ffmpeg, Chrome, Python itself) are reported with the command to install them; it never runs brew/apt.
set -uo pipefail
INSTALL=0; [ "${1:-}" = "--install" ] && INSTALL=1
export STICKFILM_HOME="${STICKFILM_HOME:-$HOME/StickFilms}"
TOOLS="$STICKFILM_HOME/.tools"; mkdir -p "$STICKFILM_HOME/characters" "$STICKFILM_HOME/films" "$TOOLS"
OS="$(uname -s)"; ok=0; bad=0
pass() { printf '  \033[32mok\033[0m   %s\n' "$1"; ok=$((ok+1)); }
fail() { printf '  \033[31mneed\033[0m %s\n       -> %s\n' "$1" "$2"; bad=$((bad+1)); }
echo "stick-film setup  (workspace: $STICKFILM_HOME)"

# --- node
if command -v node >/dev/null && [ "$(node -p 'process.versions.node.split(".")[0]')" -ge 18 ]; then pass "node $(node -v)"; else fail "Node.js 18+" "Mac: brew install node   (flow-mcp already needs Node 22)"; fi

# --- playwright-core (drives Chrome; no browser download)
pw_found() { node -e "const r=require('module').createRequire(process.cwd()+'/');for(const p of ['playwright-core','playwright','$TOOLS/node_modules/playwright-core','/opt/node22/lib/node_modules/playwright']){try{r(p);process.exit(0)}catch(e){}}process.exit(1)" 2>/dev/null; }
if pw_found; then pass "playwright"; elif [ $INSTALL = 1 ] && command -v npm >/dev/null; then
  (cd "$TOOLS" && npm install --silent --no-audit --no-fund playwright-core@1.56.1 >/dev/null 2>&1) && pass "playwright-core installed in $TOOLS" || fail "playwright-core" "cd $TOOLS && npm install playwright-core"
else fail "playwright-core" "run: bash $(dirname "$0")/setup.sh --install"; fi

# --- Chrome
CH=""
for p in "${CHROME_PATH:-}" "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" "/Applications/Chromium.app/Contents/MacOS/Chromium" /usr/bin/google-chrome /usr/bin/chromium /usr/bin/chromium-browser; do [ -n "$p" ] && [ -x "$p" ] && CH="$p" && break; done
[ -z "$CH" ] && for p in "${PLAYWRIGHT_BROWSERS_PATH:-/opt/pw-browsers}"/chromium-*/chrome-linux/chrome; do [ -x "$p" ] && CH="$p"; done
if [ -n "$CH" ]; then pass "chrome: $CH"; else fail "Google Chrome" "install Chrome (flow-mcp uses it too), or set CHROME_PATH"; fi

# --- ffmpeg
if command -v ffmpeg >/dev/null; then pass "ffmpeg $(ffmpeg -version | head -1 | awk '{print $3}')"; else fail "ffmpeg" "Mac: brew install ffmpeg   Linux: apt install ffmpeg"; fi

# --- python (3.10-3.13 for onnxruntime wheels)
PYB=""
for c in python3.12 python3.13 python3.11 python3.10 python3; do
  if command -v $c >/dev/null && $c -c 'import sys; sys.exit(0 if (3,10) <= sys.version_info[:2] <= (3,13) else 1)' 2>/dev/null; then PYB=$(command -v $c); break; fi
done
if [ -z "$PYB" ]; then fail "Python 3.10-3.13" "Mac: brew install python@3.12"; else pass "python $($PYB -V 2>&1 | awk '{print $2}') ($PYB)"; fi
# sf runs $TOOLS/venv/bin/python when it exists, otherwise python3: check that one
RUNPY="$(command -v python3 || true)"; [ -x "$TOOLS/venv/bin/python" ] && RUNPY="$TOOLS/venv/bin/python"
deps_ok() { [ -n "$1" ] && "$1" -c 'import numpy, soundfile, PIL, kokoro_onnx' 2>/dev/null; }
if deps_ok "$RUNPY"; then pass "python packages (numpy soundfile pillow kokoro-onnx) in $RUNPY"
elif [ $INSTALL = 1 ] && [ -n "$PYB" ]; then
  echo "       creating $TOOLS/venv and installing numpy soundfile pillow kokoro-onnx..."
  [ -x "$TOOLS/venv/bin/python" ] || "$PYB" -m venv "$TOOLS/venv"
  "$TOOLS/venv/bin/python" -m pip install -q --upgrade pip >/dev/null 2>&1
  if "$TOOLS/venv/bin/python" -m pip install -q numpy soundfile pillow kokoro-onnx && deps_ok "$TOOLS/venv/bin/python"; then pass "python packages installed in $TOOLS/venv"; else fail "python packages" "$TOOLS/venv/bin/python -m pip install numpy soundfile pillow kokoro-onnx"; fi
else fail "python packages" "run: bash $(dirname "$0")/setup.sh --install"; fi

# --- Kokoro voice model (Apache-2.0 weights, ~354 MB, downloaded once)
KD="${KOKORO_DIR:-$TOOLS/kokoro}"; REL="https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0"
have_k() { [ -s "$KD/kokoro-v1.0.onnx" ] && [ -s "$KD/voices-v1.0.bin" ] && [ "$(wc -c < "$KD/kokoro-v1.0.onnx")" -gt 300000000 ]; }
if have_k; then pass "kokoro voice model ($KD)"
elif [ $INSTALL = 1 ]; then
  mkdir -p "$KD"; echo "       downloading the Kokoro voice model (~354 MB)..."
  curl -fL --retry 3 -o "$KD/kokoro-v1.0.onnx" "$REL/kokoro-v1.0.onnx" && curl -fL --retry 3 -o "$KD/voices-v1.0.bin" "$REL/voices-v1.0.bin"
  have_k && pass "kokoro voice model downloaded" || fail "kokoro model" "download kokoro-v1.0.onnx and voices-v1.0.bin from $REL into $KD"
else fail "kokoro voice model" "run: bash $(dirname "$0")/setup.sh --install   (or set KOKORO_DIR)"; fi

# --- Flow MCP (stills for the character kit). Its tools are checked from Claude with flow_status.
if [ -d "$HOME/flow-mcp" ] || [ -d "$HOME/.flow-mcp" ]; then pass "flow-mcp found (Claude still checks it with flow_status)"
else printf '  \033[33mnote\033[0m flow-mcp not found on this machine: the kit falls back to prompts you run in Flow by hand\n'; fi
[ "$OS" = "Darwin" ] && case "$STICKFILM_HOME" in "$HOME/Desktop"*|"$HOME/Documents"*|"$HOME/Downloads"*) printf '  \033[33mnote\033[0m macOS protects %s; flow-mcp cannot read references there. Prefer ~/StickFilms.\n' "$STICKFILM_HOME";; esac

echo "$ok ready, $bad missing"
[ $bad = 0 ]
