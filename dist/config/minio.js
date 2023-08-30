"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bookBucketName = exports.minioClient = void 0;
const Minio = require('minio');
const bookBucketName = 'book-bucket';
exports.bookBucketName = bookBucketName;
const minioClient = new Minio.Client({
    endPoint: process.env.MINIO_END_POINT,
    port: 9000,
    useSSL: false,
    accessKey: process.env.MINIO_ACCESS_KEY,
    secretKey: process.env.MINIO_SECRET_KEY
});
exports.minioClient = minioClient;
function createBucket() {
    minioClient.bucketExists(bookBucketName, function (err, exists) {
        if (err) {
            return console.log('Error check bucket', err);
        }
        if (!exists) {
            minioClient.makeBucket(bookBucketName, 'us-east-1', function (err) {
                if (err) {
                    return console.log('Error creating bucket.', err);
                }
                console.log('Bucket created successfully in "us-east-1".');
            });
        }
        else {
            console.log('Bucket: ', bookBucketName);
        }
    });
}
createBucket();
