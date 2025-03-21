import express from 'express';
import { StatusCodes } from 'http-status-codes';
import Customers from '../../../db/customers/customers';
import { isValidEmail, isValidUUID } from '../../../utils/utils';

export const customersRouter = express.Router();


customersRouter.post('/create', async (req, res) => {
    try {
        const { email } = req.body;
        const issuer = req['user'];
        if(!email){
            return res.status(StatusCodes.BAD_GATEWAY).json({  });
        }

        const customers = new Customers(issuer.userId);

        const response = await customers.create(req.body);
        if(!response){
            return res.status(StatusCodes.BAD_GATEWAY).json({ });
        }

        return res.status(StatusCodes.OK).json({
            success: true,
            message: "success",
            data: response
        })
    }
    catch(error){
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({});
    }



});

customersRouter.patch('/update/:id', async (req, res) => {
    const { id } = req.params;
    const issuer = req['user'];

    const { email = null, name = null, metadata = null } = req.body;

    if((!email && !name && !metadata) || !id) {
        return res.status(StatusCodes.BAD_REQUEST).json({ })
    }

    if(!isValidEmail(id) && !isValidUUID(id)){
        return res.status(StatusCodes.BAD_REQUEST).json({});
    }

    const customers = new Customers(issuer.userId);
    
    const fields = { 
        email: email,
        name: name,
        metadata: metadata
    };

    const response = await customers.update({
        id: id,
        fields: fields
    });

   
    if(!response){
        return res.status(StatusCodes.CONFLICT).json({})
    }


    return res.status(StatusCodes.OK).json({
        success: true,
        message: "success",
        data: response
    });
})

export async function fnAllCustomers (req, res) {
    const issuer = req['user'];

    const { transactions } = req.query;

    const customers = new Customers(issuer.userId);

    let transactionsStr = (transactions || "").toString();

    if(transactionsStr.toLowerCase() != "false" && transactionsStr.toLowerCase() != "true"){
        transactionsStr = "false";
    }

    const showTransactions = eval(transactionsStr.toLowerCase() || "false");

    const response = await customers.all({showTransactions: showTransactions});

    res.status(StatusCodes.OK).json({
        success: true,
        message: "success",
        data: response
    })
}

export async function fnParticularCustomer(req, res) {
    const { id } = req.params;
    const issuer = req['user'];

    if(!id){
        return res.status(StatusCodes.BAD_REQUEST).json({});
    }

    if(!isValidEmail(id) && !isValidUUID(id)){
        return res.status(StatusCodes.BAD_REQUEST).json({});
    }

    const customers = new Customers(issuer.userId);
    
    const response = await customers.get({id: id});

    if(!response){
        return res.status(StatusCodes.NOT_FOUND).json({});
    }
    
    return res.status(StatusCodes.OK).json({
        success: true,
        message: "success",
        data: response
    })
}

export async function fnCustomerTransactions(req, res) {
    const { id } = req.params;
    const issuer = req['user'];

    if(!id){
        return res.status(StatusCodes.BAD_REQUEST).json({});
    }

    if(!isValidUUID(id)){
        return res.status(StatusCodes.BAD_REQUEST).json({});
    }

    const customers = new Customers(issuer.userId);
    
    const response = await customers.transactions({id: id});

    if(!response){
        return res.status(StatusCodes.NOT_FOUND).json({success: false, message: "Customer doesn't exist", data: {}});
    }
    
    return res.status(StatusCodes.OK).json({
        success: true,
        message: "success",
        data: response
    })
}

customersRouter.get('/all', fnAllCustomers)

customersRouter.get('/:id', fnParticularCustomer);

customersRouter.get('/:id/transactions', fnCustomerTransactions);
