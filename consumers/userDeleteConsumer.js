const { Kafka } = require('kafkajs');
const crypto = require('crypto');
const User = require('../models/User');
require('dotenv').config();

const kafka = new Kafka({ brokers: [process.env.KAFKA_BROKER] });
const consumer = kafka.consumer({ groupId: 'user-delete-group' });

const decryptMessage = (encryptedMessage) => {
  const iv = Buffer.from(encryptedMessage.iv, 'hex');
  const encryptedData = Buffer.from(encryptedMessage.encryptedData, 'hex');
  const key = Buffer.from(process.env.ENCRYPTION_KEY, 'hex');

  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
  let decrypted = decipher.update(encryptedData);
  decrypted = Buffer.concat([decrypted, decipher.final()]);

  return decrypted.toString();
};

const run = async () => {
  await consumer.connect();
  await consumer.subscribe({ topic: process.env.KAFKA_TOPIC_USER_DELETE, fromBeginning: true });

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      try {
        console.log('Mensaje recibido desde Kafka:', message.value.toString());
        const encryptedMessage = JSON.parse(message.value.toString());
        console.log('Mensaje encriptado:', encryptedMessage);
        const decryptedMessage = decryptMessage(encryptedMessage);
        console.log('Mensaje descifrado:', decryptedMessage);

        const { id } = JSON.parse(decryptedMessage);
        console.log('ID del usuario a eliminar:', id);

        await User.findByIdAndDelete(id);
        console.log('Usuario eliminado exitosamente');
      } catch (error) {
        console.error('Error al procesar el mensaje de Kafka:', error);
      }
    },
  });
};

run().catch(console.error);

module.exports = { run };
