import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import archiver from 'archiver';

/**
 * Handler for downloading the browser extension as a ZIP file
 */
export async function downloadExtension(req: Request, res: Response) {
  try {
    // Set content headers
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename=focusflow-extension.zip');
    
    // Create a zip archive
    const archive = archiver('zip', {
      zlib: { level: 9 } // Maximum compression
    });
    
    // Pipe the archive to the response
    archive.pipe(res);
    
    // Add the browser-extension directory to the archive
    const extensionPath = path.join(process.cwd(), 'browser-extension');
    archive.directory(extensionPath, 'focusflow-extension');
    
    // Finalize the archive (this is when the actual ZIP file gets generated)
    await archive.finalize();
    
    console.log('Extension download successful');
  } catch (error) {
    console.error('Error creating extension zip:', error);
    res.status(500).send('Error creating extension ZIP file');
  }
}

/**
 * API route to check if the extension is available for download
 */
export async function checkExtensionAvailability(req: Request, res: Response) {
  try {
    const extensionPath = path.join(process.cwd(), 'browser-extension');
    const manifestPath = path.join(extensionPath, 'manifest.json');
    
    // Check if the extension directory and manifest file exist
    const extensionExists = fs.existsSync(extensionPath);
    const manifestExists = fs.existsSync(manifestPath);
    
    if (extensionExists && manifestExists) {
      try {
        // Try to read the manifest to get version info
        const manifestContent = fs.readFileSync(manifestPath, 'utf8');
        const manifest = JSON.parse(manifestContent);
        
        res.json({
          available: true,
          version: manifest.version,
          name: manifest.name,
          description: manifest.description
        });
      } catch (parseError) {
        // Manifest exists but couldn't be parsed
        res.json({
          available: true,
          error: 'Could not parse manifest'
        });
      }
    } else {
      res.json({
        available: false,
        reason: !extensionExists ? 'Extension directory not found' : 'Manifest file not found'
      });
    }
  } catch (error) {
    console.error('Error checking extension availability:', error);
    res.status(500).json({
      available: false,
      error: 'Server error checking extension availability'
    });
  }
}