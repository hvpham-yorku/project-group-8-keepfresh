FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Render and other hosts set PORT; local Docker defaults to 8000.
EXPOSE 8000
ENV PORT=8000
CMD sh -c "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}"
