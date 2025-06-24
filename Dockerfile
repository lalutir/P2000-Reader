# Use an official lightweight Python image
FROM python:3.9-slim

# Set the working directory inside the container
WORKDIR /app

# Copy the file that lists the dependencies
COPY requirements.txt .

# Install the dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy your Python script into the container
COPY main.py .

# Command to run when the container starts
# The script will be run by this command
CMD ["python", "-u", "main.py"]