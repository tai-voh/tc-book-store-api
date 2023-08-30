import { SchemaRegistry, readAVSCAsync } from '@kafkajs/confluent-schema-registry';

const registry = new SchemaRegistry({
    host: `http://${process.env.SCHEMA_REGISTRY_HOST}` || 'http://localhost:8081',
  });

const registerBookSchema = async () => {
    try {
      const schema = await readAVSCAsync('./public/schema/avro/schema.avsc');
      const { id } = await registry.register(schema);
      return id;
    } catch (e) {
      console.log(e);
    }
};

const registerOrderSchema = async () => {
  try {
    const schema = await readAVSCAsync('./public/schema/avro/order-schema.avsc');
    const { id } = await registry.register(schema);
    return id;
  } catch (e) {
    console.log(e);
  }
};

const registryEncode = async (type, data) => {
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
          return content;
      }
    }
    return false;
  } catch (e) {
    console.log(e);
  }
}

export { registry, registerBookSchema, registerOrderSchema, registryEncode };