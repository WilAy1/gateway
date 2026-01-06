import express from 'express';
import cors from 'cors';
import { privateRouter } from './api/private/router';
import { publicRouter } from './api/public/router';
import { userRouter } from './users/router';
import { monitorPending, resubscribe } from './services/solana/solana';
import Rates from './services/rates/rates';
import { StatusCodes } from 'http-status-codes';
// import listEndpoints from 'express-list-endpoints';
// import { listTree } from './others/others';
// import path from 'path';


const app = express();
const port = parseInt(process.env.PORT) || 3000;



monitorPending();
resubscribe();


// Run fetchAndSaveRates every minute

const rates = new Rates();
setInterval(rates.fetchRates.bind(rates) , 60000);

rates.fetchRates();

app.use(cors())
app.use(express.json());


// app.post('/webhook', express.raw({type: "*/*" }), (req, res) => {
//   const logEntry = {
//     timestamp: new Date().toISOString(),
//     method: req.method,
//     url: req.originalUrl,
//     ip: req.ip,
//     headers: req.headers,
//     rawBody: req.body, // important!
//     parsedBody: req.body,
//   };

//   console.log("📩 Incoming webhook:", JSON.stringify(logEntry, null, 2));

//   // Respond quickly — providers expect fast ACK
//   res.status(200).send("ok");
// });


app.use('/api/p', privateRouter);
app.use('/api/', publicRouter);
app.use('/', userRouter);
  
const host = '0.0.0.0';
app.listen(port, host, () => {
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

// listEndpoints(app).forEach((endpoint)=>{
//   console.log(endpoint.path);
// })

// // Replace '.' with your target directory
// const targetDir = process.argv[2] || './src';
// console.log(path.basename(targetDir));
// listTree(targetDir);


// const webhook = new Webhook("54c91f1c-9ae9-45aa-9825-c16800f7881f");
// webhook.sendTransaction("62eb013a-5f30-4493-9e92-07b5c07a3abd", WebhookEvent.TRANSACTION_COMPLETED);





export default app;
