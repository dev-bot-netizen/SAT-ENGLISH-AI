// This version of the resource reader uses dynamic imports instead of `fs.readFile`.
// This is a more robust method for serverless environments like Vercel, as it ensures
// the resource files are included in the function bundle during the build process,
// preventing runtime "file not found" errors.

const resourceModules: Record<string, () => Promise<{ content: string }>> = {
  // All Topics
  'resources/all-types/all-types-1.ts': () => import('../../src/resources/all-types/all-types-1.js'),
  'resources/all-types/all-types-2.ts': () => import('../../src/resources/all-types/all-types-2.js'),
  'resources/all-types/all-types-3.ts': () => import('../../src/resources/all-types/all-types-3.js'),

  // Boundaries
  'resources/boundaries/boundaries-1.ts': () => import('../../src/resources/boundaries/boundaries-1.js'),
  'resources/boundaries/boundaries-2.ts': () => import('../../src/resources/boundaries/boundaries-2.js'),
  'resources/boundaries/boundaries-3.ts': () => import('../../src/resources/boundaries/boundaries-3.js'),
  
  // Central ideas and details
  'resources/central-ideas-and-details/central-ideas-and-details-1.ts': () => import('../../src/resources/central-ideas-and-details/central-ideas-and-details-1.js'),
  'resources/central-ideas-and-details/central-ideas-and-details-2.ts': () => import('../../src/resources/central-ideas-and-details/central-ideas-and-details-2.js'),
  'resources/central-ideas-and-details/central-ideas-and-details-3.ts': () => import('../../src/resources/central-ideas-and-details/central-ideas-and-details-3.js'),
  
  // Cross-text connections
  'resources/cross-text-connections/cross-text-connections-1.ts': () => import('../../src/resources/cross-text-connections/cross-text-connections-1.js'),
  'resources/cross-text-connections/cross-text-connections-2.ts': () => import('../../src/resources/cross-text-connections/cross-text-connections-2.js'),
  'resources/cross-text-connections/cross-text-connections-3.ts': () => import('../../src/resources/cross-text-connections/cross-text-connections-3.js'),
  
  // Form, Structure, and Sense
  'resources/form-structure-and-sense/form-structure-and-sense-1.ts': () => import('../../src/resources/form-structure-and-sense/form-structure-and-sense-1.js'),
  'resources/form-structure-and-sense/form-structure-and-sense-2.ts': () => import('../../src/resources/form-structure-and-sense/form-structure-and-sense-2.js'),
  'resources/form-structure-and-sense/form-structure-and-sense-3.ts': () => import('../../src/resources/form-structure-and-sense/form-structure-and-sense-3.js'),

  // Inference
  'resources/inference/inference-1.ts': () => import('../../src/resources/inference/inference-1.js'),
  'resources/inference/inference-2.ts': () => import('../../src/resources/inference/inference-2.js'),
  'resources/inference/inference-3.ts': () => import('../../src/resources/inference/inference-3.js'),

  // Rhetorical synthesis
  'resources/rhetorical-synthesis/rhetorical-synthesis-1.ts': () => import('../../src/resources/rhetorical-synthesis/rhetorical-synthesis-1.js'),
  'resources/rhetorical-synthesis/rhetorical-synthesis-2.ts': () => import('../../src/resources/rhetorical-synthesis/rhetorical-synthesis-2.js'),
  'resources/rhetorical-synthesis/rhetorical-synthesis-3.ts': () => import('../../src/resources/rhetorical-synthesis/rhetorical-synthesis-3.js'),

  // Text structure and purpose
  'resources/text-structure-and-purpose/text-structure-and-purpose-1.ts': () => import('../../src/resources/text-structure-and-purpose/text-structure-and-purpose-1.js'),
  'resources/text-structure-and-purpose/text-structure-and-purpose-2.ts': () => import('../../src/resources/text-structure-and-purpose/text-structure-and-purpose-2.js'),
  'resources/text-structure-and-purpose/text-structure-and-purpose-3.ts': () => import('../../src/resources/text-structure-and-purpose/text-structure-and-purpose-3.js'),

  // Transitions
  'resources/transitions/transitions-1.ts': () => import('../../src/resources/transitions/transitions-1.js'),
  'resources/transitions/transitions-2.ts': () => import('../../src/resources/transitions/transitions-2.js'),
  'resources/transitions/transitions-3.ts': () => import('../../src/resources/transitions/transitions-3.js'),

  // Words in context
  'resources/words-in-context/words-in-context-1.ts': () => import('../../src/resources/words-in-context/words-in-context-1.js'),
  'resources/words-in-context/words-in-context-2.ts': () => import('../../src/resources/words-in-context/words-in-context-2.js'),
  'resources/words-in-context/words-in-context-3.ts': () => import('../../src/resources/words-in-context/words-in-context-3.js'),
};

/**
 * Dynamically retrieves the content of a resource file.
 * @param path The relative path to the resource file, e.g., 'resources/all-types/all-types-1.ts'
 * @returns A promise that resolves with the text content of the file.
 * @throws An error if the resource is not found in the map or fails to load.
 */
export const getResourceContentOnServer = async (path: string): Promise<string> => {
  if (resourceModules.hasOwnProperty(path)) {
    try {
      const module = await resourceModules[path]();
      return module.content;
    } catch (error) {
        const originalError = error instanceof Error ? error.message : String(error);
        console.error(`Failed to dynamically load server-side resource for path: ${path}`, error);
        return Promise.reject(new Error(`Server could not load resource: ${path}. This may be a build configuration issue. Details: ${originalError}`));
    }
  }
  const errorMessage = `Server-side resource not found for path: ${path}. Check the mapping in api/_lib/resourceReader.ts.`;
  console.error(errorMessage);
  return Promise.reject(new Error(errorMessage));
};