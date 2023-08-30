import { Kafka } from 'kafkajs';

const clientId = 'tc-books-store';
const brokers = process.env.KAFKA_BROKER ? [ process.env.KAFKA_BROKER ] : ['127.0.0.1:9092'];
const kafka = new Kafka({ clientId, brokers});
const producer = kafka.producer();
const bookConsumer = kafka.consumer({ groupId: clientId });
const orderConsumer = kafka.consumer({ groupId: clientId });

export { producer, bookConsumer, orderConsumer };
