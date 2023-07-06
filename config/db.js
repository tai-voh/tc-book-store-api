const mongoose = require('mongoose');

async function connectToDatabase() {
    try {
        await mongoose.connect(process.env.DB_CONNECTION_STRING, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        console.log('Connected to the database');
    } catch (error) {
        console.error('Error connecting to the database:', error);
        // Handle the error appropriately (e.g., exit the application, retry connection, etc.)
    }
}

async function disconnectFromDatabase() {
    try {
        await mongoose.disconnect();
        console.log('Disconnected from the database');
    } catch (error) {
        console.error('Error disconnecting from the database:', error);
    }
}

module.exports = { mongoose, connectToDatabase, disconnectFromDatabase };
