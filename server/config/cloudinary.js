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
    
    // Check if it is a standard image (to optionally format it)
    const isImage = file.mimetype.startsWith('image');

    return {
      folder: 'highrise-vault',
      
      // "auto" is CRITICAL for .dwg and .dxf to work (treats them as raw files)
      resource_type: 'auto', 
      
      // 🔥 UPDATED: The Complete Engineering List
      allowed_formats: [
        // Standard Images
        'jpg', 'jpeg', 'png', 'gif', 'webp', 'heic', 'heif', 'bmp', 'tiff', 'svg',
        
        // Documents
        'pdf', 'doc', 'docx', 'txt', 'rtf',
        
        // Spreadsheets & Presentations
        'xls', 'xlsx', 'csv', 'ppt', 'pptx',

        // 🔥 ENGINEERING & CAD (AutoCAD, Revit, 3D)
        'dwg',  // AutoCAD Drawing
        'dxf',  // Drawing Exchange Format
        'dgn',  // MicroStation
        'stl',  // 3D Printing
        'obj',  // 3D Object
        'fbx',  // 3D Model
        'skp',  // SketchUp
        'ifc',  // BIM (Building Information Modeling)
        'rvt',  // Revit (Note: Cloudinary treats these as raw)
        
        // Archives (Engineers often upload zipped folders)
        'zip', 'rar', '7z'
      ],
      
      // Force standard images to JPG, but leave CAD files alone
      format: isImage ? 'jpg' : undefined,

      use_filename: true, 
      unique_filename: false, 
      overwrite: true,
    };
  },
});

const upload = multer({ storage });

module.exports = upload;