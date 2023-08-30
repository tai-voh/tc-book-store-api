import { S3Client } from '@aws-sdk/client-s3';

const s3 = new S3Client({
    endpoint: `http://${process.env.MINIO_END_POINT}:${proces.env.MINIO_PORT}`,
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.MINIO_ACCESS_KEY,
        secretAccessKey:process.env.MINIO_SECRET_KEY
    }
});

export default s3;