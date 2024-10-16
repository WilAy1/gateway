import express from 'express';
import cors from 'cors';
import { privateRouter } from './api/private/router';
import { publicRouter } from './api/public/router';
import { userRouter } from './users/router';
import { resubscribe } from './services/solana/solana';
import Rates from './services/rates/rates';
import { StatusCodes } from 'http-status-codes';


const app = express();
const port = 3000;

if(true){

resubscribe();


// Run fetchAndSaveRates every minute


const rates = new Rates();
setInterval(rates.fetchRates.bind(rates) , 60000);

rates.fetchRates();
}
app.use(cors())
app.use(express.json());

app.use('/api/p', privateRouter);
app.use('/api/', publicRouter);
app.use('/', userRouter);
  

app.listen(port, () => {
    return console.log(`Express server is listening at http://localhost:${port} 🚀`);
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err, req, res, _) => {
    console.error(err.stack); // Log the error for debugging purposes
  
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Internal Server Error',
      error: err.message,
    });
});

app.get('*', function(req, res){
  res.status(StatusCodes.NOT_FOUND).json({
      success: false,
      message: "Invalid resource requested",
      data: {}
   });
})

app.post('*', function(req, res){
  res.status(StatusCodes.NOT_FOUND).json({
      success: false,
      message: "Invalid resource requested",
      data: {}
   });
})


export default app;
