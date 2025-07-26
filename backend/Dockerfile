# Use official lightweight Python image
FROM python:3.10-slim

# Set work directory
WORKDIR /app

# Copy backend code
COPY . .

# Install Python dependencies
RUN pip install --upgrade pip && pip install -r requirements.txt

# Expose port (change if your app uses a different one)
EXPOSE 5000

# Run the app
CMD ["python", "app.py"]
