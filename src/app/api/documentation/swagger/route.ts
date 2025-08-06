import { NextRequest, NextResponse } from 'next/server';
import { OpenAPIDocumentationService } from '../../../../services/documentationService';
import { OpenAPISpec } from '../../../../types/configuration';

const documentationService = new OpenAPIDocumentationService();

/**
 * Generate Swagger UI HTML from OpenAPI specification
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { spec } = body;

    // Validate required fields
    if (!spec) {
      return NextResponse.json(
        { error: 'OpenAPI specification is required' },
        { status: 400 }
      );
    }

    // Generate Swagger UI HTML
    const swaggerUI = await documentationService.generateSwaggerUI(
      spec as OpenAPISpec
    );

    return new NextResponse(swaggerUI, {
      status: 200,
      headers: {
        'Content-Type': 'text/html',
      },
    });
  } catch (error) {
    console.error('Error generating Swagger UI:', error);
    return NextResponse.json(
      { error: 'Failed to generate Swagger UI' },
      { status: 500 }
    );
  }
}

/**
 * Get Swagger UI HTML with embedded specification
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const specUrl = searchParams.get('specUrl');

  if (!specUrl) {
    return NextResponse.json(
      { error: 'specUrl parameter is required' },
      { status: 400 }
    );
  }

  try {
    // Generate Swagger UI HTML that loads spec from URL
    const swaggerUI = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>API Documentation</title>
  <link rel="stylesheet" type="text/css" href="https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui.css" />
  <style>
    html {
      box-sizing: border-box;
      overflow: -moz-scrollbars-vertical;
      overflow-y: scroll;
    }
    *, *:before, *:after {
      box-sizing: inherit;
    }
    body {
      margin:0;
      background: #fafafa;
    }
  </style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui-bundle.js"></script>
  <script src="https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui-standalone-preset.js"></script>
  <script>
    window.onload = function() {
      const ui = SwaggerUIBundle({
        url: '${specUrl}',
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIStandalonePreset
        ],
        plugins: [
          SwaggerUIBundle.plugins.DownloadUrl
        ],
        layout: "StandaloneLayout"
      });
    };
  </script>
</body>
</html>`;

    return new NextResponse(swaggerUI, {
      status: 200,
      headers: {
        'Content-Type': 'text/html',
      },
    });
  } catch (error) {
    console.error('Error generating Swagger UI:', error);
    return NextResponse.json(
      { error: 'Failed to generate Swagger UI' },
      { status: 500 }
    );
  }
}
