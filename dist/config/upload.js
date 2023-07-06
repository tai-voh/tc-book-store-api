"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const multer_1 = __importDefault(require("multer"));
//Setting storage engine for uploading images
// const storageEngine = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, "src/public/images/")
//   },
//   filename: (req, file, cb) => {
//     // cb(null, `${Date.now()}--${file.originalname}`);
//     cb(null, path.extname(file.originalname));
//   },
// });
// //initializing multer
// const upload = multer({
//   storage: storageEngine
// });
const upload = (0, multer_1.default)({ dest: './uploads/' });
exports.default = upload;
