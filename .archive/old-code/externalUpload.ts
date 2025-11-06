// External upload service integrations for very large files
export class ExternalUploadService {
  
  // Generate a share link with instructions for external services
  static generateExternalUploadInstructions(eventId: string, maxSizeMB: number): {
    email: string;
    subject: string;
    body: string;
    alternativeServices: Array<{
      name: string;
      url: string;
      description: string;
      steps: string[];
    }>;
  } {
    const eventUrl = `https://snapworxx.com/e/${eventId}`;
    
    return {
      email: 'uploads@snapworxx.com', // You can set up this email alias
      subject: `Large File Upload for Event ${eventId}`,
      body: `Hi Snapworxx Team,

I have a large video file (over ${maxSizeMB}MB) that I'd like to upload to my event gallery.

Event ID: ${eventId}
Event URL: ${eventUrl}

Please let me know the best way to share this file with you.

Thanks!`,
      
      alternativeServices: [
        {
          name: 'Google Drive',
          url: 'https://drive.google.com',
          description: 'Upload to Google Drive and share the link',
          steps: [
            'Upload your video to Google Drive',
            'Right-click the file and select "Share"',
            'Set permissions to "Anyone with the link can view"',
            'Copy the share link',
            'Email the link to uploads@snapworxx.com with your event ID'
          ]
        },
        {
          name: 'Dropbox',
          url: 'https://dropbox.com',
          description: 'Upload to Dropbox and create a share link',
          steps: [
            'Upload your video to Dropbox',
            'Click the "Share" button next to your file',
            'Create a link and set it to public',
            'Copy the share link',
            'Email the link to uploads@snapworxx.com with your event ID'
          ]
        },
        {
          name: 'WeTransfer',
          url: 'https://wetransfer.com',
          description: 'Send large files up to 2GB for free',
          steps: [
            'Go to wetransfer.com',
            'Add your video file',
            'Enter uploads@snapworxx.com as the recipient',
            'Add your event ID in the message',
            'Click "Transfer" to send'
          ]
        },
        {
          name: 'File Compression',
          url: '#compression',
          description: 'Compress your video before uploading',
          steps: [
            'Use video compression software (see our guide)',
            'Reduce file size to under ' + maxSizeMB + 'MB',
            'Upload directly through the standard upload form',
            'Maintain good quality while reducing size'
          ]
        }
      ]
    };
  }

  // Create a mailto link for easy email sending
  static createEmailLink(eventId: string, maxSizeMB: number): string {
    const instructions = this.generateExternalUploadInstructions(eventId, maxSizeMB);
    const encodedSubject = encodeURIComponent(instructions.subject);
    const encodedBody = encodeURIComponent(instructions.body);
    
    return `mailto:${instructions.email}?subject=${encodedSubject}&body=${encodedBody}`;
  }

  // Check if file needs external upload
  static needsExternalUpload(file: File, maxSizeMB: number): boolean {
    const fileSizeMB = file.size / (1024 * 1024);
    return fileSizeMB > maxSizeMB;
  }

  // Get file size in human readable format
  static getHumanFileSize(bytes: number): string {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + ' ' + sizes[i];
  }
}