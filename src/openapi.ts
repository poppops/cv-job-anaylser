export const openApiSpec = {
  openapi: "3.0.3",
  info: {
    title: "CV Job Analyser API",
    description: "API for analysing CVs and job descriptions, assessing job fit, and chatting with JobFit.",
    version: "1.0.0",
  },
  servers: [
    { url: "/api", description: "API base path" },
  ],
  paths: {
    "/": {
      get: {
        summary: "Get API info",
        description: "Returns application metadata and version.",
        operationId: "getApiInfo",
        responses: {
          "200": {
            description: "API info",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    app: { type: "string", example: "CV Job Analyser" },
                    version: { type: "string", example: "1.0.0" },
                    description: { type: "string" },
                    environment: { type: "string" },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/import/cv": {
      post: {
        summary: "Import and parse CV",
        description: "Upload a CV file (PDF, DOCX, TXT) and get a structured parse of the content.",
        operationId: "importCv",
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                required: ["cv"],
                properties: {
                  cv: {
                    type: "string",
                    format: "binary",
                    description: "CV file (PDF, DOCX, or TXT)",
                  },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Parsed CV",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/CV" },
              },
            },
          },
          "400": {
            description: "No file uploaded",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
          "500": {
            description: "Processing failed",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorDetail" },
              },
            },
          },
        },
      },
    },
    "/import/jobs": {
      post: {
        summary: "Import and parse job descriptions",
        description: "Upload one or more job description files (PDF, DOCX, TXT) and get structured parses.",
        operationId: "importJobs",
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                properties: {
                  jobs: {
                    type: "array",
                    items: { type: "string", format: "binary" },
                    description: "Job description files",
                  },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Array of parsed jobs",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: { $ref: "#/components/schemas/Job" },
                },
              },
            },
          },
          "400": {
            description: "No files provided",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
          "500": {
            description: "Processing failed",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorDetail" },
              },
            },
          },
        },
      },
    },
    "/assess/job-fit": {
      post: {
        summary: "Assess job fit",
        description: "Assess how well a CV matches a job description. Requires parsed CV and Job objects from import endpoints.",
        operationId: "assessJobFit",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["cv", "job"],
                properties: {
                  cv: { $ref: "#/components/schemas/CV" },
                  job: { $ref: "#/components/schemas/Job" },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Job fit assessment",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/JobFit" },
              },
            },
          },
          "500": {
            description: "Assessment failed",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorDetail" },
              },
            },
          },
        },
      },
    },
    "/chat": {
      post: {
        summary: "Chat with JobFit",
        description: "Upload CV/jobs, ask questions, or both. Maintains session state. Requires CV and at least one job before submitting text queries.",
        operationId: "chat",
        parameters: [
          {
            name: "sessionId",
            in: "query",
            schema: { type: "string" },
            description: "Session ID for state persistence (optional; generated if omitted)",
          },
          {
            name: "x-session-id",
            in: "header",
            schema: { type: "string" },
            description: "Session ID via header (alternative to body/query)",
          },
        ],
        requestBody: {
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                properties: {
                  sessionId: { type: "string", description: "Session ID for state persistence" },
                  input: { type: "string", description: "Text question (requires CV + at least 1 job)" },
                  cv: {
                    type: "string",
                    format: "binary",
                    description: "CV file (PDF, DOCX, TXT)",
                  },
                  jobs: {
                    type: "array",
                    items: { type: "string", format: "binary" },
                    description: "Job description files (max 10)",
                  },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Chat response",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    sessionId: { type: "string", description: "Session ID (use for subsequent requests)" },
                    response: { type: "string", description: "JobFit response (markdown)" },
                  },
                },
              },
            },
          },
          "400": {
            description: "Validation error",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    sessionId: { type: "string" },
                    error: { type: "string" },
                  },
                },
              },
            },
          },
          "500": {
            description: "Processing failed",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    sessionId: { type: "string" },
                    error: { type: "string" },
                    details: { type: "string" },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  components: {
    schemas: {
      CV: {
        type: "object",
        properties: {
          name: { type: "string" },
          summary: { type: "string" },
          strengths: { type: "string" },
          skills: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                description: { type: "string" },
                level: { type: "string", enum: ["beginner", "intermediate", "advanced"] },
              },
            },
          },
        },
      },
      Job: {
        type: "object",
        properties: {
          title: { type: "string" },
          description: { type: "string" },
          requirements: { type: "array", items: { type: "string" } },
          benefits: { type: "array", items: { type: "string" } },
          salary: { type: "number" },
          location: { type: "string" },
          company: { type: "string" },
          url: { type: "string" },
        },
      },
      JobFit: {
        type: "object",
        properties: {
          fit: { type: "number", description: "Fit score (0-100)" },
          reasons: { type: "array", items: { type: "string" } },
          skillsMatch: { type: "array", items: { type: "string" } },
          skillsMissing: { type: "array", items: { type: "string" } },
        },
      },
      Error: {
        type: "object",
        properties: {
          message: { type: "string" },
        },
      },
      ErrorDetail: {
        type: "object",
        properties: {
          error: { type: "string" },
          details: { type: "string" },
        },
      },
    },
  },
};
