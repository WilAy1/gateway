import express from 'express';
import { privateRouter } from './api/private/router';
import { publicRouter } from './api/public/router';
import { userRouter } from './users/router';


const app = express();
const port = 3000;


app.use(express.json());

app.use('/api/', publicRouter);
app.use('/api/p', privateRouter);
app.use('/', userRouter);
  

app.listen(port, () => {
    return console.log(`Express server is listening at http://localhost:${port} 🚀`);
});
