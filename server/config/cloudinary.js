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
    return {
      folder: 'highrise-vault',
      resource_type: 'auto', // 🔥 CRITICAL: Fixes PDF opening issues
      allowed_formats: ['jpg', 'png', 'jpeg', 'pdf', 'doc', 'docx', 'xlsx'],
      
      // 🔥 FIX NAME: Use the original filename
      use_filename: true, 
      unique_filename: false, // Warning: If 2 files have same name, one will be overwritten. Set true if you want random numbers.
      overwrite: true,
      
      // Force the name to be the original name (minus extension)
      public_id: file.originalname.replace(/\.[^/.]+$/, ""), 
    };
  },
});

const upload = multer({ storage });

module.exports = upload;