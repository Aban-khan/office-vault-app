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
    
    // 1. Get the extension (dwg, jpg, pdf)
    const ext = file.originalname.split('.').pop().toLowerCase();
    
    // 2. Get the name WITHOUT the extension
    const nameOnly = file.originalname.replace(/\.[^/.]+$/, "");

    // 🔥 FIX: Sanitize the name (Replace spaces & weird chars with underscores)
    // "NEW BUILDINGS AT BLOCK 1" -> "NEW_BUILDINGS_AT_BLOCK_1"
    const safeName = nameOnly.replace(/[^a-zA-Z0-9]/g, "_");

    // 3. Define Raw vs Image types
    const rawFiles = ['dwg', 'dxf', 'zip', 'rar', '7z', 'stl', 'obj', 'fbx', 'rvt', 'ifc', 'dgn'];
    const imageFiles = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'heic', 'heif', 'bmp', 'tiff'];

    // 4. LOGIC: Handle Raw Files (DWG, CAD, Zips)
    if (rawFiles.includes(ext)) {
      return {
        folder: 'highrise-vault',
        resource_type: 'raw', // Force Raw
        public_id: safeName,  // Use the CLEAN name
        format: undefined,    // Do not convert
      };
    }

    // 5. LOGIC: Handle Images & PDFs
    return {
      folder: 'highrise-vault',
      resource_type: 'auto', 
      public_id: safeName,  // Use the CLEAN name
      
      // Convert Images to JPG (fix iPhone HEIC), leave PDF alone
      format: imageFiles.includes(ext) ? 'jpg' : undefined,
    };
  },
});

const upload = multer({ storage });

module.exports = upload;