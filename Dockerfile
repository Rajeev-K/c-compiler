# Dockerfile for C compiler
# All source files are mounted at runtime via a shared volume
#
# Usage:
#   docker build -t c-compiler .
#   docker run --rm -v /path/to/your/files:/workspace c-compiler test.c
#
# The shared folder should contain:
#   - compiler.ts (the TypeScript compiler)
#   - your .c file(s)
#
# After running, the shared folder will also contain:
#   - output.s (generated assembly)
#   - program (executable)


FROM node:20-bookworm

# Install GCC (native architecture)
RUN apt-get update && \
    apt-get install -y gcc && \
    rm -rf /var/lib/apt/lists/*

# Install TypeScript globally
RUN npm install -g typescript

WORKDIR /workspace

COPY entrypoint.sh /entrypoint.sh

# Remove Windows CRLF line endings (\r\n) so the script runs correctly on Linux
RUN sed -i 's/\r$//' /entrypoint.sh && chmod +x /entrypoint.sh

ENTRYPOINT ["/bin/sh", "/entrypoint.sh"]
CMD ["test.c", "program"]
