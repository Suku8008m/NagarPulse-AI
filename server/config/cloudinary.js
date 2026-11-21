const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || '',
  api_key: process.env.CLOUDINARY_API_KEY || '',
  api_secret: process.env.CLOUDINARY_API_SECRET || ''
});

/**
 * Uploads a buffer to Cloudinary
 * Supports unsigned preset upload and signed upload_stream
 * @param {Buffer} buffer - File buffer
 * @param {string} mimeType - e.g. 'image/jpeg', 'audio/webm'
 * @param {string} folder - Destination folder on Cloudinary
 * @returns {Promise<string>} Uploaded file HTTPS URL
 */
const uploadToCloudinary = async (buffer, mimeType = 'image/jpeg', folder = 'nagarpulse') => {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME || 'dtnrw3fol';
  const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET || 'my_preset';

  // Strategy 1: Unsigned upload via fetch (fastest and supports verified presets)
  if (cloudName && uploadPreset) {
    try {
      const base64Data = buffer.toString('base64');
      const dataUri = `data:${mimeType};base64,${base64Data}`;

      const formData = new FormData();
      formData.append('file', dataUri);
      formData.append('upload_preset', uploadPreset);
      formData.append('folder', folder);

      const endpoint = mimeType.startsWith('audio')
        ? `https://api.cloudinary.com/v1_1/${cloudName}/video/upload`
        : `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;

      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData
      });

      const data = await response.json();
      if (data && data.secure_url) {
        return data.secure_url;
      }
      if (data && data.url) {
        return data.url.replace('http://', 'https://');
      }
      console.warn('[Cloudinary Direct Upload Notice]:', data?.error?.message || 'No secure_url');
    } catch (directErr) {
      console.warn('[Cloudinary Direct Upload Error]:', directErr.message);
    }
  }

  // Strategy 2: Official Cloudinary upload stream
  const isCloudinaryConfigured =
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET;

  if (isCloudinaryConfigured) {
    try {
      const url = await new Promise((resolve, reject) => {
        const isAudio = mimeType.startsWith('audio');
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder,
            resource_type: isAudio ? 'video' : 'image',
            allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'mp3', 'wav', 'ogg', 'webm', 'm4a']
          },
          (error, result) => {
            if (error) return reject(error);
            resolve(result.secure_url || result.url);
          }
        );
        uploadStream.end(buffer);
      });
      if (url) return url;
    } catch (signedErr) {
      console.warn('[Cloudinary Signed Upload Error]:', signedErr.message);
    }
  }

  // Fallback to inline data URI if Cloudinary is completely unreachable
  console.warn('[Cloudinary] Falling back to inline data URI.');
  const base64 = buffer.toString('base64');
  return `data:${mimeType};base64,${base64}`;
};

module.exports = {
  cloudinary,
  uploadToCloudinary
};
