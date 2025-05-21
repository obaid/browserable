# Environment Variables

This document details all the environment variables used in the Browserable services. Each variable is explained with its default value and possible configurations.

## UI Service Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `NODE_TLS_REJECT_UNAUTHORIZED` | "0" | Controls Node.js TLS certificate validation |
| `NEW_RELIC_NO_CONFIG_FILE` | 1 | Disables New Relic config file requirement |
| `NEW_RELIC_ENABLED` | 0 | Controls New Relic monitoring |
| `APP_NAME` | "Browserable" | Application name |
| `DOMAIN` | "localhost:2001" | UI server domain |
| `ROOT_DOMAIN` | "localhost" | Root domain for the application |
| `PORT` | 2001 | UI server port |
| `DEBUG` | 1 | Enables debug mode |
| `HTTPS_DOMAIN` | 0 | Controls HTTPS requirement |
| `NODE_ENV` | "development" | Node.js environment |
| `REACT_APP_TASKS_PUBLIC_URL` | "http://localhost:2003" | Tasks server URL |
| `REACT_APP_UPPY_COMPANION_URL` | "http://localhost:2003/companion" | Uppy companion URL for file uploads |
| `REACT_APP_S3_ENDPOINT` | "nyc3.digitaloceanspaces.com" | S3 endpoint for file storage |
| `REACT_APP_SINGLE_USER_MODE` | 1 | Enables single user mode |
| `SECRET` | "please_update_this_secret" | Secret key for session management |
| `REACT_APP_COOKIE_UUID_KEY` | "browserable_uuid" | Cookie key for UUID storage |

## Tasks Service Variables

### Core Configuration
| Variable | Default | Description |
|----------|---------|-------------|
| `APP_NAME` | "Browserable" | Application name |
| `NODE_TLS_REJECT_UNAUTHORIZED` | "0" | Controls Node.js TLS certificate validation |
| `DOMAIN` | "localhost:2003" | Tasks server domain |
| `ROOT_DOMAIN` | "localhost" | Root domain for the application |
| `PORT` | 2003 | Tasks server port |
| `UPPY_PORT` | 2010 | Uppy server port |
| `DEBUG` | 1 | Enables debug mode |
| `HTTPS_DOMAIN` | 0 | Controls HTTPS requirement |
| `NODE_ENV` | "development" | Node.js environment |

### Database and Storage
| Variable | Default | Description |
|----------|---------|-------------|
| `TASKS_DATABASE_URL` | "postgresql://..." | PostgreSQL connection URL |
| `TASKS_REDIS_URL` | "redis://browserable-redis:6379/" | Redis connection URL |
| `MONGODB_URL` | "mongodb://..." | MongoDB connection URL |
| `S3_ENDPOINT` | "http://minio:9000" | S3 compatible storage endpoint |
| `S3_BUCKET` | "browserable" | S3 bucket name |
| `S3_KEY` | "browserable-storage" | S3 access key |
| `S3_SECRET` | "secret1234" | S3 secret key |
| `S3_PRIVATE_DOMAIN` | "http://minio:9000" | Private S3 domain |
| `S3_PUBLIC_DOMAIN` | "http://localhost:9000" | Public S3 domain |

### Security and Authentication
| Variable | Default | Description |
|----------|---------|-------------|
| `SECRET` | "please_update_this_secret" | Secret key for session management |
| `COOKIE_UUID_KEY` | "browserable_uuid" | Cookie key for UUID storage |
| `SINGLE_USER_MODE` | 1 | Enables single user mode |
| `ADMIN_EMAIL` | "admin@browserable.ai" | Admin email address |

### CORS and API Configuration
| Variable | Default | Description |
|----------|---------|-------------|
| `CORS_DOMAINS` | "http://localhost:2001,..." | Allowed CORS domains |
| `COMPANION_CLIENT_ORIGINS` | "http://localhost:2001,..." | Allowed Uppy companion origins |
| `COMPANION_UPLOAD_URLS` | "http://localhost:2001,..." | Allowed upload URLs |
| `COMPANION_AWS_ACL` | "public-read" | AWS ACL for uploaded files |

### Email Configuration
| Variable | Default | Description |
|----------|---------|-------------|
| `SMTP_HOST` | "" | SMTP server host |
| `SMTP_PORT` | "" | SMTP server port |
| `SMTP_USER` | "" | SMTP username |
| `SMTP_PASS` | "" | SMTP password |
| `SMTP_FROM` | "" | SMTP from address |

### API Keys and Integration
| Variable | Default | Description |
|----------|---------|-------------|
| `OPENAI_API_KEY` | "" | OpenAI API key |
| `CLAUDE_API_KEY` | "" | Claude API key |
| `QWEN_API_KEY` | "" | Qwen API key |
| `GEMINI_API_KEY` | "" | Gemini API key |
| `DEEPSEEK_API_KEY` | "" | Deepseek API key |
| `GROQ_API_KEY` | "" | Groq API key |
| `OPENROUTER_API_KEY` | "" | OpenRouter API key |
| `STEEL_API_KEY` | "" | Steel browser API key |
| `HYPER_BROWSER_API_KEY` | "" | Hyper browser API key |
| `BROWSERBASE_API_KEY` | "" | Browserbase API key |
| `BROWSERBASE_PROJECT_ID` | "" | Browserbase project ID |

### Browser Configuration
| Variable | Default | Description |
|----------|---------|-------------|
| `BROWSER_CONCURRENCY` | 1 | Maximum concurrent browser sessions |

### Monitoring and Logging
| Variable | Default | Description |
|----------|---------|-------------|
| `NEW_RELIC_NO_CONFIG_FILE` | 1 | Disables New Relic config file requirement |
| `NEW_RELIC_ENABLED` | 0 | Controls New Relic monitoring |
| `DISCORD_ADMIN_WEBHOOK` | "" | Discord webhook for admin notifications |

## Usage

To configure these variables:

1. For local development, set them in your `docker-compose.dev.yml` file
2. For production, set them in your environment or use a `.env` file
3. For cloud deployment, set them in your cloud provider's environment variables section

Example `.env` file:
```env
APP_NAME=Browserable
PORT=2003
DEBUG=1
OPENAI_API_KEY=your-api-key
```

## Notes

- Empty string defaults ("") indicate optional variables
- Some variables are required in production but optional in development
- Security-related variables should be properly secured in production
- API keys should never be committed to version control 