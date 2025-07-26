# Use slim Python base image
FROM python:3.10-slim

# Set working directory
WORKDIR /app

# Copy project files into container
COPY . /app

# Install dependencies
RUN pip install --upgrade pip && pip install -r requirements.txt

# Expose the port your Flask app runs on
EXPOSE 8080

# Start Gunicorn server (app:app => file:Flask instance)
CMD ["gunicorn", "-b", "0.0.0.0:8080", "app:app"]
