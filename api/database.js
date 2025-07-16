import DatabaseService from '../src/services/DatabaseService.js';

export default async function handler(req, res) {
  // Enable CORS for local development
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Parse JSON body
    let body = {};
    if (req.body && typeof req.body === 'object') {
      body = req.body;
    } else if (req.body && typeof req.body === 'string') {
      try {
        body = JSON.parse(req.body);
      } catch (e) {
        return res.status(400).json({ error: 'Invalid JSON body' });
      }
    }

    const { action, ...params } = body;

    if (!action) {
      return res.status(400).json({ error: 'Missing action parameter' });
    }

    // Create database service instance for server-side operations
    const dbService = new DatabaseService();
    
    // Execute the database operation
    const result = await dbService.executeServerQuery(action, params);
    
    res.json(result);

  } catch (error) {
    console.error('Database API error:', error);
    
    // Handle specific database errors
    if (error.message.includes('duplicate key value')) {
      return res.status(409).json({ 
        error: 'A record with this name already exists',
        details: error.message 
      });
    }
    
    if (error.message.includes('foreign key constraint')) {
      return res.status(400).json({ 
        error: 'Cannot delete this record as it is referenced by other data',
        details: error.message 
      });
    }
    
    if (error.message.includes('database') || error.message.includes('connection')) {
      return res.status(503).json({ 
        error: 'Database connection error. Please check your environment configuration.',
        details: error.message 
      });
    }
    
    res.status(500).json({ 
      error: error.message || 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
} 