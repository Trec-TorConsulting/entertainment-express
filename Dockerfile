FROM python:3.11-slim

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    BENCH_ENVIRONMENT=production

# Install system dependencies
RUN apt-get update && apt-get install -y \
    git \
    curl \
    wget \
    build-essential \
    mariadb-client \
    postgresql-client \
    libmariadb-dev \
    python3-dev \
    npm \
    gettext-base \
    && rm -rf /var/lib/apt/lists/*

# Create frappe user
RUN useradd -m -u 1000 frappe && mkdir -p /home/frappe && chown -R frappe:frappe /home/frappe

WORKDIR /home/frappe

USER frappe

# Add user bin to PATH
ENV PATH="/home/frappe/.local/bin:$PATH"

# Install bench
RUN pip install frappe-bench

# Create bench environment
RUN /home/frappe/.local/bin/bench init --frappe-branch=version-15 --no-procfile frappe-bench

WORKDIR /home/frappe/frappe-bench

# Install ERPNext
RUN bench get-app erpnext --branch=version-15

# Copy Entertainment Express app
COPY --chown=frappe:frappe entertainment_express/ ./apps/entertainment_express/

# Install Entertainment Express (treat as local path app)
RUN bench install-app entertainment_express 2>&1 || echo "App install deferred to site initialization"

# Expose ports
EXPOSE 8000 8001 9000

# Default: web server
CMD ["bench", "start", "--port", "8000"]
