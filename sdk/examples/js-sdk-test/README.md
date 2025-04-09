# Browserable JS SDK Test

This is a simple test project that demonstrates the usage of the Browserable JavaScript SDK.

## Configuration

The test project is configured with:
- API Key: `c201d91c07316560630a5e6f4e6506b028472b6a2053ffcaa5c9b987129b3457`
- Base URL: `http://localhost:2003/api/v1`

## Setup

1. Install dependencies:
```bash
npm install
```

2. Run the test:
```bash
npm test
```

## What the Test Does

The test script performs several operations:
1. Gets user profile information
2. Lists available browsers
3. Creates a new browser session

Each operation's response is logged to the console for inspection.

## Error Handling

The test includes basic error handling and will display detailed error messages if any API calls fail. 