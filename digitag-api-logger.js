/**
 * @name Digitag API Logger
 * @version 1.0.0
 * @description A lightweight API event tracker that prints detailed information in the browser console
 * @author <ricardopxlcl>
 * @license MIT
 * @repository https://github.com/ricardopxlcl/digitag-api-logger
 * 
 * @example
 * // Initialize the logger
 * DigitagApiLogger.init({
 *   logToConsole: true,
 *   logRequestBody: true
 * });
 * 
 * // Capture specific API requests
 * DigitagApiLogger.capture("POST", "api.example.com/data", (data) => {
 *   console.log("Data captured:", data);
 *   return data; // Return modified data if needed
 * });
 */

;(() => {
  // Configuration
  const config = {
    enabled: true,
    maxLoggedEvents: 100,
    excludeUrls: [], // URLs to exclude from tracking
    includeUrls: [], // If specified, only these URLs will be tracked
    logRequestBody: true,
    logResponseBody: true,
    groupByEndpoint: true,
    useColors: true,
    logLevel: "info", // 'debug', 'info', 'warn', 'error'
    logToConsole: true, // Option to control console output
  }

  // Counters
  let eventCount = 0
  let eventsByEndpoint = {}

  // Array to store registered captures
  const captures = []

  // Console colors
  const colors = {
    GET: "#2196F3", // Blue
    POST: "#4CAF50", // Green
    PUT: "#FF9800", // Orange
    DELETE: "#F44336", // Red
    PATCH: "#9C27B0", // Purple
    success: "#4CAF50", // Green
    error: "#F44336", // Red
    pending: "#757575", // Gray
  }

  // Utilities
  function shouldTrackUrl(url) {
    // If there are specifically included URLs, only track those
    if (config.includeUrls.length > 0) {
      return config.includeUrls.some((pattern) => url.includes(pattern))
    }

    // Exclude specific URLs
    if (config.excludeUrls.length > 0) {
      return !config.excludeUrls.some((pattern) => url.includes(pattern))
    }

    return true
  }

  function extractEndpoint(url) {
    try {
      const urlObj = new URL(url)
      const pathParts = urlObj.pathname.split("/")
      return pathParts.slice(0, 3).join("/") // Take up to the second level of the path
    } catch (e) {
      // If not a valid URL, try to extract the path
      const parts = url.split("/")
      return parts.slice(0, 3).join("/")
    }
  }

  function parseHeaders(headers) {
    if (!headers) return {}

    // If it's a Headers object
    if (typeof headers.get === "function") {
      const result = {}
      headers.forEach((value, key) => {
        result[key] = value
      })
      return result
    }

    // If it's a simple object
    if (typeof headers === "object") {
      return { ...headers }
    }

    return {}
  }

  function tryParseJson(text) {
    if (!text) return null
    try {
      return JSON.parse(text)
    } catch (e) {
      return text
    }
  }

  function formatTime() {
    const now = new Date()
    return now.toLocaleTimeString() + "." + now.getMilliseconds().toString().padStart(3, "0")
  }

  // Function to check if a request matches a capture
  function matchCapture(method, url) {
    return captures.find((capture) => {
      // Verify method match (either wildcard or exact match)
      if (capture.method !== "*" && capture.method !== method) {
        return false
      }

      // Improved URL matching
      if (typeof capture.urlPattern === "string") {
        // For string patterns, do a more flexible match
        // Remove protocol and any trailing slashes for comparison
        const normalizedUrl = url.replace(/^https?:\/\//, "").replace(/\/$/, "")
        const normalizedPattern = capture.urlPattern.replace(/^https?:\/\//, "").replace(/\/$/, "")

        return normalizedUrl.includes(normalizedPattern)
      } else if (capture.urlPattern instanceof RegExp) {
        return capture.urlPattern.test(url)
      }

      return false
    })
  }

  // Main log function
  function logApiEvent(eventType, method, url, details = {}) {
    if (!config.enabled) return

    const endpoint = extractEndpoint(url)

    // Update counters
    eventCount++
    eventsByEndpoint[endpoint] = (eventsByEndpoint[endpoint] || 0) + 1

    // If logToConsole is disabled, don't print to console but continue processing
    if (!config.logToConsole) return

    // Determine log style based on method
    const methodColor = colors[method] || "#757575"
    const statusColor = details.status
      ? details.status >= 200 && details.status < 300
        ? colors.success
        : colors.error
      : colors.pending

    // Create console groups if configured
    if (config.groupByEndpoint) {
      console.groupCollapsed(
        `%c ${formatTime()} %c ${method} %c ${url.split("?")[0]} %c ${details.status || "PENDING"}`,
        "color: #888; font-weight: normal;",
        `color: white; background-color: ${methodColor}; padding: 2px 6px; border-radius: 3px; font-weight: bold;`,
        "color: #0277BD; font-weight: bold;",
        `color: white; background-color: ${statusColor}; padding: 2px 6px; border-radius: 3px;`,
      )
    } else {
      console.log(
        `%c ${formatTime()} %c ${method} %c ${url.split("?")[0]} %c ${details.status || "PENDING"}`,
        "color: #888; font-weight: normal;",
        `color: white; background-color: ${methodColor}; padding: 2px 6px; border-radius: 3px; font-weight: bold;`,
        "color: #0277BD; font-weight: bold;",
        `color: white; background-color: ${statusColor}; padding: 2px 6px; border-radius: 3px;`,
      )
    }

    // Request details
    if (details.requestHeaders || details.requestBody) {
      console.log("%cRequest:", "font-weight: bold;")

      if (details.requestHeaders && Object.keys(details.requestHeaders).length > 0) {
        console.log("Headers:", details.requestHeaders)
      }

      if (config.logRequestBody && details.requestBody) {
        console.log("Body:", details.requestBody)
      }
    }

    // Response details
    if (details.responseHeaders || details.responseBody) {
      console.log("%cResponse:", "font-weight: bold;")

      if (details.status) {
        console.log("Status:", details.status)
      }

      if (details.responseHeaders && Object.keys(details.responseHeaders).length > 0) {
        console.log("Headers:", details.responseHeaders)
      }

      if (config.logResponseBody && details.responseBody) {
        console.log("Body:", details.responseBody)
      }

      if (details.duration) {
        console.log("Duration:", details.duration + "ms")
      }
    }

    // Error
    if (details.error) {
      console.error("Error:", details.error)
    }

    // Close group if configured
    if (config.groupByEndpoint) {
      console.groupEnd()
    }

    // Statistics
    if (eventCount % 10 === 0) {
      console.log(`%c API Logger: ${eventCount} events captured`, "color: #888; font-style: italic;")
    }
  }

  // Interceptors
  function interceptFetch() {
    const originalFetch = window.fetch

    window.fetch = function (resource, init) {
      const url = typeof resource === "string" ? resource : resource.url
      const method = (init?.method || "GET").toUpperCase()

      if (!shouldTrackUrl(url)) {
        return originalFetch.apply(this, arguments)
      }

      const startTime = Date.now()

      // Capture request details
      let requestDetails = {}

      if (config.logRequestBody && init) {
        const headers = parseHeaders(init.headers)
        let body = init.body

        // Try to parse the body if it's FormData or URLSearchParams
        if (body instanceof FormData || body instanceof URLSearchParams) {
          const bodyObj = {}
          for (const pair of body.entries()) {
            bodyObj[pair[0]] = pair[1]
          }
          body = bodyObj
        } else if (typeof body === "string") {
          body = tryParseJson(body)
        }

        requestDetails = {
          requestHeaders: headers,
          requestBody: body,
        }
      }

      // Check if there's a capture that matches this request
      const matchedCapture = matchCapture(method, url)

      // If there's a matching capture, execute the callback
      if (matchedCapture && requestDetails.requestBody) {
        try {
          // Execute the callback with the data and request context
          const modifiedData = matchedCapture.callback(requestDetails.requestBody, {
            method,
            url,
            headers: requestDetails.requestHeaders,
          })

          // If the callback returns data, replace the request body
          if (modifiedData !== undefined) {
            // Create a new init with the modified data
            const newInit = { ...init }

            // Convert the modified data to the appropriate format
            if (typeof init.body === "string") {
              newInit.body = JSON.stringify(modifiedData)
            } else if (init.body instanceof FormData) {
              const formData = new FormData()
              for (const key in modifiedData) {
                formData.append(key, modifiedData[key])
              }
              newInit.body = formData
            } else {
              newInit.body = modifiedData
            }

            // Update the arguments
            arguments[1] = newInit

            // Update the request details for the log
            requestDetails.requestBody = modifiedData
          }
        } catch (err) {
          console.error("Error in capture callback:", err)
        }
      }

      // Initial log
      logApiEvent("fetch", method, url, requestDetails)

      // Perform the original request
      return originalFetch
        .apply(this, arguments)
        .then((response) => {
          // Clone the response to avoid consuming it
          const clone = response.clone()
          const endTime = Date.now()
          const duration = endTime - startTime

          // Extract headers
          const headers = parseHeaders(clone.headers)

          // Check if there's a capture that matches this request
          const matchedCapture = matchCapture(method, url)

          // Capture the response body if configured
          if (config.logResponseBody || matchedCapture) {
            clone
              .text()
              .then((text) => {
                const body = tryParseJson(text)

                // If there's a matching capture, execute the callback with the response
                if (matchedCapture) {
                  try {
                    // Execute the callback with the response data and context
                    matchedCapture.callback(body, {
                      method,
                      url,
                      headers: requestDetails.requestHeaders,
                      responseHeaders: headers,
                      status: clone.status,
                      duration: duration,
                      isResponse: true, // Indicate that it's a response
                    })

                    if (config.logToConsole) {
                      console.log(
                        `%c Capture executed (response): ${method} ${url}`,
                        "background: #9C27B0; color: white; padding: 2px 4px; border-radius: 3px;",
                      )
                    }
                  } catch (err) {
                    if (config.logToConsole) {
                      console.error("Error in capture callback (response):", err)
                    }
                  }
                }

                // Complete log with response
                logApiEvent("fetch", method, url, {
                  ...requestDetails,
                  status: clone.status,
                  responseHeaders: headers,
                  responseBody: body,
                  duration: duration,
                })
              })
              .catch((err) => {
                // Error log
                logApiEvent("fetch", method, url, {
                  ...requestDetails,
                  status: clone.status,
                  responseHeaders: headers,
                  error: "Error reading response body: " + err.message,
                  duration: duration,
                })
              })
          } else {
            // Log without response body
            logApiEvent("fetch", method, url, {
              ...requestDetails,
              status: clone.status,
              responseHeaders: headers,
              duration: duration,
            })
          }

          return response
        })
        .catch((err) => {
          // Log request error
          logApiEvent("fetch", method, url, {
            ...requestDetails,
            error: err.message,
            duration: Date.now() - startTime,
          })
          throw err
        })
    }
  }

  function interceptXHR() {
    const originalOpen = XMLHttpRequest.prototype.open
    const originalSend = XMLHttpRequest.prototype.send

    XMLHttpRequest.prototype.open = function (method, url) {
      this._apiLoggerMethod = method.toUpperCase()
      this._apiLoggerUrl = url
      this._apiLoggerStartTime = Date.now()
      return originalOpen.apply(this, arguments)
    }

    XMLHttpRequest.prototype.send = function (body) {
      if (!this._apiLoggerUrl || !shouldTrackUrl(this._apiLoggerUrl)) {
        return originalSend.apply(this, arguments)
      }

      // Capture request details
      let requestDetails = {}
      let parsedBody = null

      if (config.logRequestBody) {
        parsedBody = body

        if (typeof body === "string") {
          parsedBody = tryParseJson(body)
        } else if (body instanceof FormData) {
          parsedBody = {}
          for (const pair of body.entries()) {
            parsedBody[pair[0]] = pair[1]
          }
        }

        requestDetails = {
          requestBody: parsedBody,
        }
      }

      // Check if there's a capture that matches this request
      const matchedCapture = matchCapture(this._apiLoggerMethod, this._apiLoggerUrl)

      // If there's a matching capture, execute the callback
      if (matchedCapture && parsedBody) {
        try {
          // Get the headers
          const headers = {}
          this.getAllResponseHeaders()
            .split("\r\n")
            .forEach((line) => {
              const parts = line.split(": ")
              if (parts.length === 2) {
                headers[parts[0]] = parts[1]
              }
            })

          // Execute the callback with the data and request context
          const modifiedData = matchedCapture.callback(parsedBody, {
            method: this._apiLoggerMethod,
            url: this._apiLoggerUrl,
            headers: headers,
          })

          // If the callback returns data, replace the request body
          if (modifiedData !== undefined) {
            // Convert the modified data to the appropriate format
            if (typeof body === "string") {
              body = JSON.stringify(modifiedData)
            } else if (body instanceof FormData) {
              const formData = new FormData()
              for (const key in modifiedData) {
                formData.append(key, modifiedData[key])
              }
              body = formData
            } else {
              body = modifiedData
            }

            // Update the request details for the log
            requestDetails.requestBody = modifiedData
          }
        } catch (err) {
          console.error("Error in capture callback (XHR):", err)
        }
      }

      // Initial log
      logApiEvent("xhr", this._apiLoggerMethod, this._apiLoggerUrl, requestDetails)

      // Intercept the response
      const originalOnReadyStateChange = this.onreadystatechange
      this.onreadystatechange = function () {
        if (this.readyState === 4) {
          // Completed
          const endTime = Date.now()
          const duration = endTime - this._apiLoggerStartTime

          // Check if there's a capture that matches this request
          const matchedCapture = matchCapture(this._apiLoggerMethod, this._apiLoggerUrl)

          let responseBody = null
          if (config.logResponseBody || matchedCapture) {
            try {
              responseBody = tryParseJson(this.responseText)

              // If there's a matching capture, execute the callback with the response
              if (matchedCapture) {
                try {
                  // Get the response headers
                  const responseHeaders = {}
                  const allHeaders = this.getAllResponseHeaders()
                  if (allHeaders) {
                    allHeaders.split("\r\n").forEach((line) => {
                      const parts = line.split(": ")
                      if (parts.length === 2) {
                        responseHeaders[parts[0]] = parts[1]
                      }
                    })
                  }

                  // Execute the callback with the response data and context
                  matchedCapture.callback(responseBody, {
                    method: this._apiLoggerMethod,
                    url: this._apiLoggerUrl,
                    responseHeaders: responseHeaders,
                    status: this.status,
                    duration: duration,
                    isResponse: true, // Indicate that it's a response
                  })

                  if (config.logToConsole) {
                    console.log(
                      `%c Capture executed (XHR response): ${this._apiLoggerMethod} ${this._apiLoggerUrl}`,
                      "background: #9C27B0; color: white; padding: 2px 4px; border-radius: 3px;",
                    )
                  }
                } catch (err) {
                  if (config.logToConsole) {
                    console.error("Error in capture callback (XHR response):", err)
                  }
                }
              }
            } catch (e) {
              responseBody = this.responseText || null
            }
          }

          // Complete log with response
          logApiEvent("xhr", this._apiLoggerMethod, this._apiLoggerUrl, {
            ...requestDetails,
            status: this.status,
            responseBody: responseBody,
            duration: duration,
          })
        }

        if (originalOnReadyStateChange) {
          originalOnReadyStateChange.apply(this, arguments)
        }
      }

      return originalSend.apply(this, body !== parsedBody ? [body] : arguments)
    }
  }

  // Public API
  window.DigitagApiLogger = {
    init: function (customConfig = {}) {
      // Apply custom configuration
      Object.assign(config, customConfig)

      // Intercept API methods
      interceptFetch()
      interceptXHR()

      if (config.logToConsole) {
        console.log(
          "%c Digitag API Logger initialized",
          "background: #4CAF50; color: white; padding: 3px 6px; border-radius: 3px;",
        )
      }
      return this
    },

    getStats: () => ({
      totalEvents: eventCount,
      eventsByEndpoint: { ...eventsByEndpoint },
    }),

    setConfig: function (newConfig) {
      Object.assign(config, newConfig)
      if (config.logToConsole) {
        console.log(
          "%c Configuration updated",
          "background: #2196F3; color: white; padding: 2px 4px; border-radius: 3px;",
        )
      }
      return this
    },

    enable: function () {
      config.enabled = true
      if (config.logToConsole) {
        console.log("%c Logger enabled", "background: #4CAF50; color: white; padding: 2px 4px; border-radius: 3px;")
      }
      return this
    },

    disable: function () {
      config.enabled = false
      if (config.logToConsole) {
        console.log(
          "%c Logger disabled",
          "background: #F44336; color: white; padding: 2px 4px; border-radius: 3px;",
        )
      }
      return this
    },

    reset: function () {
      eventCount = 0
      eventsByEndpoint = {}
      if (config.logToConsole) {
        console.log(
          "%c Statistics reset",
          "background: #FF9800; color: white; padding: 2px 4px; border-radius: 3px;",
        )
      }
      return this
    },

    // Function to capture specific requests
    capture: (method, urlPattern, callback) => {
      const captureId = Date.now() + Math.random().toString(36).substr(2, 9)

      // Register the capture
      captures.push({
        id: captureId,
        method: method.toUpperCase(),
        urlPattern: urlPattern,
        callback: callback,
      })

      if (config.logToConsole) {
        console.log(
          `%c Capture registered: ${method.toUpperCase()} ${urlPattern}`,
          "background: #9C27B0; color: white; padding: 2px 4px; border-radius: 3px;",
        )
        console.log(
          `%c For GET requests, the capture will execute with response data`,
          "color: #9C27B0; font-style: italic;",
        )
      }

      // Return an object with methods to manage this capture
      return {
        id: captureId,
        remove: () => {
          const index = captures.findIndex((c) => c.id === captureId)
          if (index !== -1) {
            captures.splice(index, 1)
            if (config.logToConsole) {
              console.log(
                `%c Capture removed: ${method.toUpperCase()} ${urlPattern}`,
                "background: #FF9800; color: white; padding: 2px 4px; border-radius: 3px;",
              )
            }
          }
        },
        update: (newCallback) => {
          const capture = captures.find((c) => c.id === captureId)
          if (capture) {
            capture.callback = newCallback
            if (config.logToConsole) {
              console.log(
                `%c Capture updated: ${method.toUpperCase()} ${urlPattern}`,
                "background: #2196F3; color: white; padding: 2px 4px; border-radius: 3px;",
              )
            }
          }
        },
      }
    },

    // Get all active captures
    getCaptures: () =>
      captures.map((c) => ({
        id: c.id,
        method: c.method,
        urlPattern: c.urlPattern instanceof RegExp ? c.urlPattern.toString() : c.urlPattern,
      })),

    // Remove all captures
    clearCaptures: function () {
      const count = captures.length
      captures.length = 0
      if (config.logToConsole) {
        console.log(
          `%c ${count} captures removed`,
          "background: #FF9800; color: white; padding: 2px 4px; border-radius: 3px;",
        )
      }
      return this
    },

    // Methods to control console logging
    enableConsoleLogging: function () {
      config.logToConsole = true
      console.log(
        "%c Console logs enabled",
        "background: #4CAF50; color: white; padding: 2px 4px; border-radius: 3px;",
      )
      return this
    },

    disableConsoleLogging: function () {
      config.logToConsole = false
      console.log(
        "%c Console logs disabled",
        "background: #F44336; color: white; padding: 2px 4px; border-radius: 3px;",
      )
      return this
    },

    // Get current configuration
    getConfig: function() {
      return { ...config };
    }
  }
})();
