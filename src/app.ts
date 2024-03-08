import express from 'express';
import { coinsRouter } from './api/public/crypto/coins/router';

const app = express();
const port = 3000;


app.get('/', (req, res) => {
  res.send('lmao Fuckme');
});

app.use('/api/', coinsRouter);

// GET request to /api/users
app.get('/api/solana/generate', async (req, res) => {
    // Handle GET request for retrieving users
    res.json({ message: 'GET request received for users' });
  });
  
  // POST request to /api/users
  app.post('/api/users', (req, res) => {
    // Handle POST request for creating a new user
    res.json({ message: 'POST request received for creating a new user' });
  });
  

app.listen(port, () => {
    return console.log(`Express server is listening at http://localhost:${port} 🚀`);
});
