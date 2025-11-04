FROM node:20-slim

WORKDIR /app

# INSTALL C++ and PYTHON DEPENDENCIES
RUN apt-get update && apt-get install -y \
    g++ \
    python3 \
    python3-pip \
    python3-venv \
    && rm -rf /var/lib/apt/lists/*

# CREATE AND ACTIVATE PYTHON VIRTUAL ENVIRONMENT
RUN python3 -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# INSTALL PYTHON PACKAGES
RUN pip install numpy matplotlib

# COPY AND INSTALL DEPENDENCIES
COPY package*.json ./
RUN npm install

# COPY SOURCE AND BUILD
COPY . .
RUN npm run build

# MAKE run.sh EXECUTABLE
RUN chmod +x run.sh

# EXPOSE BACKEND PORT
EXPOSE 8080

# START THE APPLICATION
CMD ["node", "dist/server.js"]

USER root
