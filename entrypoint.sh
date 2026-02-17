#!/bin/bash
set -e

SOURCE_FILE="${1:-test.c}"
OUTPUT_NAME="${2:-program}"

echo "=== C Compiler Pipeline ==="
echo "Source: ${SOURCE_FILE}"
echo ""

# Check if compiler.ts exists
if [ ! -f "compiler.ts" ]; then
    echo "Error: compiler.ts not found in /workspace"
    exit 1
fi

# Check if source file exists
if [ ! -f "${SOURCE_FILE}" ]; then
    echo "Error: ${SOURCE_FILE} not found in /workspace"
    exit 1
fi

# Compile TypeScript (only if dist doesn't exist or compiler.ts is newer)
if [ ! -f "dist/compiler.js" ] || [ "compiler.ts" -nt "dist/compiler.js" ]; then
    echo "[1/4] Compiling TypeScript..."
    tsc compiler.ts --outDir dist --target ES2020 --module commonjs --esModuleInterop --skipLibCheck
else
    echo "[1/4] TypeScript already compiled (skipping)"
fi

# Generate assembly
echo "[2/4] Generating assembly..."
node dist/compiler.js "${SOURCE_FILE}" > output.s

# Assemble and link
echo "[3/4] Assembling and linking..."
gcc -no-pie -o "${OUTPUT_NAME}" output.s

# Run the program
echo "[4/4] Running ${OUTPUT_NAME}..."
echo ""
echo "=== Output ==="
./"${OUTPUT_NAME}"
