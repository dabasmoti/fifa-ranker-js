/**
 * Service for managing file storage using Vercel Blob via API routes
 * Handles JSON data storage for cleaner data management
 */
class VercelBlobService {
  constructor() {
    // Use API routes to avoid CORS issues
    this.apiBase = '/api/blob';
  }

  /**
   * Save JSON data to Vercel Blob storage
   * @param {string} filename - Name of the file (e.g., 'fifa-players.json')
   * @param {Object|Array} data - Data to save as JSON
   * @returns {Promise<Object>} Blob object with URL
   */
  async saveFile(filename, data) {
    try {
      console.log(`📤 Uploading ${filename} to Vercel Blob...`);
      
      const jsonData = JSON.stringify(data, null, 2);
      
      const response = await fetch(this.apiBase, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        },
        body: JSON.stringify({
          action: 'upload',
          filename: filename,
          data: jsonData,
          _t: Date.now() // Add timestamp to prevent caching
        })
      });

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}`;
        try {
          const error = await response.json();
          errorMessage = error.error || errorMessage;
        } catch (e) {
          // If response is not JSON, use status text
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const blob = await response.json();
      console.log(`✅ Successfully uploaded ${filename}:`, blob.url);
      return blob;
      
    } catch (error) {
      console.error(`❌ Failed to upload ${filename}:`, error);
      
      // Provide helpful error messages
      if (error.message.includes('token') || error.message.includes('Unauthorized')) {
        throw new Error(`Vercel Blob token not configured. Configure BLOB_READ_WRITE_TOKEN in your Vercel project.`);
      }
      
      if (error.message.includes('404') || error.message.includes('Not Found')) {
        throw new Error(`API route not found. Make sure the api/blob.js file exists and is properly configured.`);
      }
      
      throw new Error(`Failed to save ${filename}: ${error.message}`);
    }
  }

  /**
   * Load JSON data from Vercel Blob storage
   * @param {string} filename - Name of the file to load
   * @returns {Promise<Object|Array>} Parsed JSON data or null if file doesn't exist
   */
  async loadFile(filename) {
    try {
      console.log(`📥 Loading ${filename} from Vercel Blob...`);
      
      const response = await fetch(this.apiBase, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        },
        body: JSON.stringify({
          action: 'list',
          filename: filename,
          _t: Date.now() // Add timestamp to prevent caching
        })
      });
      
      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}`;
        try {
          const error = await response.json();
          errorMessage = error.error || errorMessage;
        } catch (e) {
          errorMessage = response.statusText || errorMessage;
        }
        
        // If API route not found, return null (file doesn't exist)
        if (response.status === 404) {
          console.log(`📄 API route not found - returning empty data for ${filename}`);
          return null;
        }
        
        throw new Error(errorMessage);
      }

      let responseData;
      try {
        responseData = await response.json();
      } catch (e) {
        console.error(`❌ Failed to parse response as JSON for ${filename}:`, e);
        return null;
      }

      const { blobs } = responseData;
      
      if (!blobs || !Array.isArray(blobs)) {
        console.log(`📄 Invalid blobs response for ${filename}`);
        return null;
      }
      
      const blob = blobs.find(b => b.pathname === filename);
      
      if (!blob) {
        console.log(`📄 File ${filename} not found in Vercel Blob`);
        return null;
      }
      
      // Fetch the actual content through API route to avoid CORS issues
      try {
        const contentResponse = await fetch(this.apiBase, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          },
          body: JSON.stringify({
            action: 'download',
            filename: filename,
            _t: Date.now() // Add timestamp to prevent caching
          })
        });
        
        if (!contentResponse.ok) {
          console.log(`📄 Failed to fetch content for ${filename}: ${contentResponse.statusText}`);
          return null;
        }
        
        const jsonText = await contentResponse.text();
        
        // Handle empty content
        if (!jsonText || jsonText.trim() === '') {
          console.log(`📄 Empty content for ${filename}`);
          return null;
        }
        
        // Parse JSON data
        let jsonData;
        try {
          jsonData = JSON.parse(jsonText);
        } catch (parseError) {
          console.error(`❌ Failed to parse JSON from ${filename}:`, parseError);
          console.log(`Raw content: ${jsonText.substring(0, 200)}...`);
          return null;
        }
        
        console.log(`✅ Successfully loaded ${filename} with ${Array.isArray(jsonData) ? jsonData.length + ' records' : 'data'}`);
        
        return jsonData;
        
      } catch (fetchError) {
        console.error(`❌ Failed to fetch content for ${filename}:`, fetchError);
        return null;
      }
      
    } catch (error) {
      console.error(`❌ Failed to load ${filename}:`, error);
      
      // For any error, return null instead of throwing
      // This allows the app to continue with empty data
      return null;
    }
  }

  /**
   * Delete a file from Vercel Blob storage
   * @param {string} filename - Name of the file to delete
   * @returns {Promise<boolean>} Success status
   */
  async deleteFile(filename) {
    try {
      console.log(`🗑️ Deleting ${filename} from Vercel Blob...`);
      
      const response = await fetch(this.apiBase, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filename: filename
        })
      });

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}`;
        try {
          const error = await response.json();
          errorMessage = error.error || errorMessage;
        } catch (e) {
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      console.log(`✅ Successfully deleted ${filename}`);
      return true;
      
    } catch (error) {
      console.error(`❌ Failed to delete ${filename}:`, error);
      
      // Don't throw on delete errors - just return false
      return false;
    }
  }

  /**
   * Check if Vercel Blob service is available
   * @returns {boolean} True if service is configured and available
   */
  static isAvailable() {
    // In browser environment, always return true
    // Let the actual API calls handle availability checks
    return true;
  }

  /**
   * List all files in the blob store
   * @returns {Promise<Array>} Array of blob objects
   */
  async listFiles() {
    try {
      console.log('📋 Listing files in Vercel Blob...');
      
      const response = await fetch(this.apiBase, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        },
        body: JSON.stringify({
          action: 'list',
          _t: Date.now() // Add timestamp to prevent caching
        })
      });
      
      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}`;
        try {
          const error = await response.json();
          errorMessage = error.error || errorMessage;
        } catch (e) {
          errorMessage = response.statusText || errorMessage;
        }
        
        // If API not available, return empty array
        if (response.status === 404) {
          console.log('📋 API route not found - returning empty file list');
          return [];
        }
        
        throw new Error(errorMessage);
      }

      let responseData;
      try {
        responseData = await response.json();
      } catch (e) {
        console.error('❌ Failed to parse list response as JSON:', e);
        return [];
      }

      const { blobs } = responseData;
      const blobArray = Array.isArray(blobs) ? blobs : [];
      
      console.log(`✅ Found ${blobArray.length} files in Vercel Blob`);
      return blobArray;
      
    } catch (error) {
      console.error('❌ Failed to list files:', error);
      
      // Return empty array instead of throwing
      return [];
    }
  }
}

export default VercelBlobService; 