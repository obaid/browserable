FROM node:18-alpine

WORKDIR /docs

# Install mintlify globally
RUN npm install -g mintlify@latest

# Copy package files
COPY package*.json ./

# Install dependencies if package.json exists
RUN if [ -f package.json ]; then npm install; fi

# Copy the rest of the documentation files
COPY . .

# Expose port 3000
EXPOSE 3000

# Start mintlify
CMD ["mintlify", "dev"] 