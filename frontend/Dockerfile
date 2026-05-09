FROM node:20-slim

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm install

# Copy the rest of the app
COPY . .

# Expose Vite port
EXPOSE 5173

# Run Vite in dev mode
CMD ["npm", "run", "dev", "--", "--host"]
