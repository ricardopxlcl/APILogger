# Digitag API Logger

A lightweight JavaScript library for tracking and intercepting API requests in web applications. This tool helps developers debug API interactions, capture specific requests, and modify request/response data on the fly.

## Features

- 🔍 Track all fetch and XMLHttpRequest API calls
- 📊 Group and filter requests by endpoint
- 🎯 Capture specific API requests based on URL patterns
- 🔄 Modify request data before it's sent
- 📝 Access response data for analysis
- 🎚️ Toggle between debug and production modes
- 📈 Collect usage statistics

## Installation

### Direct include

Add the script tag to your HTML:
```
`<script src="digitag-api-logger.js"></script>`
```

### NPM (coming soon)
```
npm install digitag-api-logger
```
BASIC USAGE
----------
```
// Initialize the logger
DigitagApiLogger.init({
  logToConsole: true,
  logRequestBody: true,
  logResponseBody: true
});
// Now all API calls will be tracked and logged to the console
```

CONFIGURATION OPTIONS
-------------------

DigitagApiLogger.init({
  enabled: true,              // Enable/disable the logger
  maxLoggedEvents: 100,       // Maximum number of events to track
  excludeUrls: [],            // URLs to exclude from tracking
  includeUrls: [],            // If specified, only these URLs will be tracked
  logRequestBody: true,       // Log request body
  logResponseBody: true,      // Log response body
  groupByEndpoint: true,      // Group logs by endpoint
  useColors: true,            // Use colors in console output
  logLevel: "info",           // Log level: 'debug', 'info', 'warn', 'error'
  logToConsole: true          // Enable/disable console output
});

CAPTURING SPECIFIC REQUESTS
-------------------------

The `capture` method allows you to intercept specific API requests:

```
// Capture a specific API endpoint
const newsletterCapture = DigitagApiLogger.capture(
  "POST",                     // HTTP method (or "*" for any method)
  "api.example.com/newsletter", // URL pattern (string or RegExp)
  (data, request) => {
    console.log("Newsletter data captured:", data);
    
    // You can modify the request data
    data.source = "website";
    
    // Return the modified data to update the request
    return data;
  }
);

// Later, you can remove the capture
newsletterCapture.remove();
```

CAPTURING RESPONSE DATA
---------------------

For GET requests or when you need to access response data:
```
DigitagApiLogger.capture("GET", "api.example.com/products", (data, request) => {
  // Check if this is response data
  if (request.isResponse) {
    console.log("Product data received:", data);
    console.log("Status:", request.status);
    console.log("Duration:", request.duration + "ms");
    
    // Store or process the data
    localStorage.setItem("productData", JSON.stringify(data));
  }
});
```

DEBUG VS PRODUCTION MODE
----------------------

Toggle between debug mode (with console logs) and production mode (silent):

// Enable debug mode
DigitagApiLogger.enableConsoleLogging();

// Enable production mode (captures still work, but no console output)
DigitagApiLogger.disableConsoleLogging();

API REFERENCE
-----------

Initialization:
- DigitagApiLogger.init(config) - Initialize the logger with configuration options

Configuration:
- DigitagApiLogger.setConfig(newConfig) - Update configuration
- DigitagApiLogger.getConfig() - Get current configuration
- DigitagApiLogger.enable() - Enable the logger
- DigitagApiLogger.disable() - Disable the logger
- DigitagApiLogger.reset() - Reset statistics

Captures:
- DigitagApiLogger.capture(method, urlPattern, callback) - Register a capture
- DigitagApiLogger.getCaptures() - Get all active captures
- DigitagApiLogger.clearCaptures() - Remove all captures

Console Logging:
- DigitagApiLogger.enableConsoleLogging() - Enable console logs
- DigitagApiLogger.disableConsoleLogging() - Disable console logs

Statistics:
- DigitagApiLogger.getStats() - Get usage statistics

LICENSE
------

MIT

CONTRIBUTING
-----------

Contributions are welcome! Please feel free to submit a Pull Request.
