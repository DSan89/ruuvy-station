# Use Deno official image
FROM denoland/deno:2.1.4

# Set working directory
WORKDIR /app

# Copy dependency files
COPY deno.json deno.lock* ./

# Copy source code
COPY src/ ./src/

# Cache dependencies
RUN deno install --entrypoint src/main.ts

# Expose any necessary ports (if needed in future)
# EXPOSE 3000

# Run the application
CMD ["deno", "run", "--allow-all", "src/main.ts"]
