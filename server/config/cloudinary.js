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
    
    // 1. Check if it looks like an image (including iPhone HEIC)
    // We check the extension directly to be safe
    const isImage = file.mimetype.startsWith('image') || file.originalname.match(/\.(heic|heif)$/i);

    return {
      folder: 'highrise-vault',
      
      // "auto" is CRITICAL. It detects if it's a raw CAD file, PDF, or Image.
      resource_type: 'auto', 
      
      // ❌ REMOVED: allowed_formats
      // 🔥 FIX: We removed the allowed list. Now it accepts EVERYTHING.
      // (DWG, DXF, ZIP, RAR, HEIC, JPG, PDF, etc.)
      
      // 🔥 FIX FOR IPHONE:
      // If it is an image, force it to 'jpg' so it works on all phones.
      // If it is a document (PDF, CAD), leave it alone (undefined).
      format: isImage ? 'jpg' : undefined,

      use_filename: true, 
      unique_filename: false, 
      overwrite: true,
    };
  },
});

const upload = multer({ storage });

module.exports = upload;