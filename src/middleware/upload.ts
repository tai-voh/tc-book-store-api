import multer from 'multer';

// Setting storage engine for uploading images
const storageEngine = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/images/")
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}--${file.originalname}`);
  },
});
  
//initializing multer
const upload = multer({
  storage: storageEngine
});


export default upload;