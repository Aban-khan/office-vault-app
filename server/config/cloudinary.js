const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');
const dotenv = require('dotenv');

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    
    // 1. Check if it is an image (including iPhone HEIC)
    const fileExtension = file.originalname.split('.').pop().toLowerCase();
    const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'heic', 'heif'].includes(fileExtension);

    return {
      folder: 'highrise-vault',
      
      // "auto" is CRITICAL. It tells Cloudinary "If it's a PDF, treat as PDF. If image, treat as image."
      resource_type: 'auto', 
      
      // 🔥 THE MASTER LIST: Explicitly allow EVERYTHING you need
      allowed_formats: [
        // Images (Standard + iPhone)
        'jpg', 'jpeg', 'png', 'gif', 'webp', 'heic', 'heif', 'bmp', 'tiff', 'svg',
        
        // Documents (Office)
        'pdf', 'doc', 'docx', 'txt', 'rtf',
        
        // Spreadsheets & Presentations
        'xls', 'xlsx', 'csv', 'ppt', 'pptx',
        
        // Engineering & CAD
        'dwg', 'dxf', 'dgn', 'stl', 'obj', 'fbx', 'skp', 'ifc', 'rvt',
        
        // Archives
        'zip', 'rar', '7z'
      ],
      
      // 🔥 FIX FOR IPHONE: Convert HEIC to JPG so it opens on Android/Windows
      // If it's not an image (like a PDF or DWG), we leave the format alone (undefined)
      format: isImage ? 'jpg' : undefined,

      use_filename: true, 
      unique_filename: false, 
      overwrite: true,
    };
  },
});

const upload = multer({ storage });

module.exports = upload;