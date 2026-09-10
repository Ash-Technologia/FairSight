# Use official lightweight Python image
FROM python:3.10-slim

# Set working directory
WORKDIR /app

# Upgrade pip and install dependencies
RUN pip install --no-cache-dir --upgrade pip

# Copy requirements and install
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy all backend code
COPY . .

# Set default port (overridden dynamically by Cloud Run/Render via $PORT)
ENV PORT=8000
EXPOSE 8000

# Start Uvicorn with dynamic port binding
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}"]
