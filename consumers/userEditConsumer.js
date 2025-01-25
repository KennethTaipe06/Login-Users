const { Kafka } = require('kafkajs');
const kafka = new Kafka({ brokers: [process.env.KAFKA_BROKER] });

const consumer = kafka.consumer({ groupId: 'user-edit-group' });

const run = async () => {
  await consumer.connect();
  await consumer.subscribe({ topic: process.env.KAFKA_TOPIC_USER_EDIT, fromBeginning: true });

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      console.log({
        value: message.value.toString(),
      });
    },
  });
};

module.exports = { run };

run().catch(console.error);
