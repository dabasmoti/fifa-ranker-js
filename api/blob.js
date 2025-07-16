import { put, list, del } from '@vercel/blob';

export default async function handler(req, res) {
  // Enable CORS for local development
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    // Parse JSON body for all requests
    let body = {};
    if (req.body && typeof req.body === 'object') {
      body = req.body;
    } else if (req.body && typeof req.body === 'string') {
      try {
        body = JSON.parse(req.body);
      } catch (e) {
        body = {};
      }
    }

    const { action, filename, data } = body;

    switch (action) {
      case 'list':
        const { blobs } = await list({
          prefix: filename || ''
        });
        res.json({ blobs });
        break;

      case 'download':
        if (!filename) {
          return res.status(400).json({ error: 'Missing filename' });
        }
        
        // Find the blob
        const { blobs: downloadBlobs } = await list({ prefix: filename });
        const targetBlob = downloadBlobs.find(b => b.pathname === filename);
        
        if (!targetBlob) {
          return res.status(404).json({ error: 'File not found' });
        }
        
        // Fetch the content from Vercel Blob and proxy it
        try {
          const blobResponse = await fetch(targetBlob.url);
          if (!blobResponse.ok) {
            return res.status(404).json({ error: 'File content not accessible' });
          }
          
          const content = await blobResponse.text();
          
          // Set appropriate headers
          res.setHeader('Content-Type', targetBlob.contentType || 'application/json');
          res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
          res.setHeader('Pragma', 'no-cache');
          res.setHeader('Expires', '0');
          
          res.send(content);
        } catch (error) {
          console.error('Error downloading blob content:', error);
          res.status(500).json({ error: 'Failed to download file content' });
        }
        break;

      case 'upload':
        if (req.method !== 'POST') {
          return res.status(405).json({ error: 'Method not allowed' });
        }
        
        if (!filename || !data) {
          return res.status(400).json({ error: 'Missing filename or data' });
        }
        
        // Determine content type based on file extension
        const isJson = filename.endsWith('.json');
        const contentType = isJson ? 'application/json' : 'text/csv';
        
        const blob = await put(filename, data, {
          access: 'public',
          contentType: contentType,
          addRandomSuffix: false,
          allowOverwrite: true
        });
        
        res.json(blob);
        break;

      case 'delete':
        if (req.method !== 'DELETE') {
          return res.status(405).json({ error: 'Method not allowed' });
        }
        
        if (!filename) {
          return res.status(400).json({ error: 'Missing filename' });
        }
        
        // First find the blob
        const { blobs: blobsToDelete } = await list({ prefix: filename });
        const blobToDelete = blobsToDelete.find(b => b.pathname === filename);
        
        if (blobToDelete) {
          await del(blobToDelete.url);
        }
        
        res.json({ success: true });
        break;

      default:
        res.status(400).json({ error: 'Invalid or missing action' });
    }
  } catch (error) {
    console.error('Blob API error:', error);
    res.status(500).json({ error: error.message });
  }
} 