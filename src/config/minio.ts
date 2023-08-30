import { readAVSCAsync } from '@kafkajs/confluent-schema-registry';
import { registry, registryEncode } from './schema';

const Minio = require('minio');

const bookBucketName = 'book-bucket';
const orderBucketName = 'order-bucket';
const minioClient = new Minio.Client({
    endPoint: process.env.MINIO_END_POINT,
    port: Number(process.env.MINIO_PORT),
    useSSL: false,
    accessKey: process.env.MINIO_ACCESS_KEY,
    secretKey: process.env.MINIO_SECRET_KEY
});

function createBucket() {
    minioClient.bucketExists(bookBucketName, function(err, exists) {
        if (err) {
          return console.log('Error check bucket', err);
        }
        if (!exists) {
            minioClient.makeBucket(bookBucketName, 'us-east-1', function(err) {
                if (err) {
                    return console.log('Error creating bucket.', err);
                }
                console.log('Book bucket created successfully in "us-east-1".');
            })
        }
        else {
            console.log('Bucket: ', bookBucketName);
        }
    });
    minioClient.bucketExists(orderBucketName, function(err, exists) {
        if (err) {
          return console.log('Error check bucket', err);
        }
        if (!exists) {
            minioClient.makeBucket(orderBucketName, 'us-east-1', function(err) {
                if (err) {
                    return console.log('Error creating bucket.', err);
                }
                console.log('Order bucket created successfully in "us-east-1".');
            })
        }
        else {
            console.log('Bucket: ', orderBucketName);
        }
    });
}
createBucket();

/**
 * Save content to Minio
 */
async function saveContent(type, data) {
    try {
        let fileName = '';
        switch (type) {
            case 'books':
                fileName = 'book';
                break;
            case 'orders':
                fileName = 'order';
                break;
            default:
                console.log('Invalid type while saving message to Minio.')
        }
        if (fileName) {
            const schema = await readAVSCAsync(`./public/schema/avro/${fileName}-schema.avsc`);
            const { id } = await registry.register(schema);
            if (id) {
                const content = await registry.encode(id, data);
                minioClient.putObject(orderBucketName, `new/${fileName}-${Date.now()}.avro`, content, function(err, etag) {
                    if (err) console.log(err);
                    else console.log('Order message uploaded successfully.');
                });
            }
        }
    } catch (error) {
        console.log(error? error['message'] : 'Some error occurred while saving order message to Minio.')
    }
}

export { minioClient, bookBucketName, orderBucketName, saveContent };