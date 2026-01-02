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
    
    // 1. Get the extension (e.g. "dwg", "jpg")
    const ext = file.originalname.split('.').pop().toLowerCase();
    
    // 2. Get the name WITHOUT the extension
    const nameOnly = file.originalname.replace(/\.[^/.]+$/, "");

    // 3. Sanitize the name (Replace spaces/special chars with underscores)
    // Example: "My Project File.dwg" -> "My_Project_File"
    const safeName = nameOnly.replace(/[^a-zA-Z0-9]/g, "_");

    // 4. Define Raw vs Image types
    // DWG, DXF, ZIP, etc. MUST be treated as "raw"
    const rawFiles = ['dwg', 'dxf', 'zip', 'rar', '7z', 'stl', 'obj', 'fbx', 'rvt', 'ifc', 'dgn'];
    
    // 5. LOGIC: Handle Raw Files (Engineering/CAD)
    if (rawFiles.includes(ext)) {
      return {
        folder: 'highrise-vault',
        resource_type: 'raw', 
        // 🔥 CRITICAL FIX: Add the extension back for Raw files!
        // Cloudinary needs "filename.dwg" to serve it correctly.
        public_id: `${safeName}.${ext}`, 
        format: undefined,
      };
    }

    // 6. LOGIC: Handle Images, PDFs, Docs
    return {
      folder: 'highrise-vault',
      resource_type: 'auto', 
      public_id: safeName, // Images don't need the extension here
      
      // If it's an image, force JPG (fixes iPhone HEIC)
      // If it's a PDF/Doc, leave it alone
      format: ['jpg', 'jpeg', 'png', 'heic', 'heif'].includes(ext) ? 'jpg' : undefined,
    };
  },
});

const upload = multer({ storage });

module.exports = upload;