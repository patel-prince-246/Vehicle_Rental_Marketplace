const express = require('express');
const mongoose = require('mongoose');

const userRoutes = require('./routes/userRoutes');
const vehicleRoutes = require('./routes/vehicleRoutes');
const bookingRoutes = require('./routes/bookingRoutes');

const dbURL = 'mongodb://127.0.0.1:27017/vehicle_db';
const app = express();
const PORT = process.env.PORT || 8000;

app.use(express.json());

mongoose.connect(dbURL)
  .then(() => {
    console.log('MongoDB connected to', dbURL);
    app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

app.get('/', (req, res) => res.send('Server is running'));

app.use('/api/users', userRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/bookings', bookingRoutes);