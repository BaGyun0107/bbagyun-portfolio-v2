import { createSwaggerSpec } from 'next-swagger-doc';

/**
 * Generate the Swagger specification
 */
export const getApiDocs = async () => {
  const spec = createSwaggerSpec({
    apiFolder: 'src/app/api',
    definition: {
      openapi: '3.0.0',
      info: {
        title: 'Portfolio API Docs',
        version: '1.0.0',
      },
      security: [],
    },
  });
  return spec;
};
