import express from 'express';
import { fnAllCustomers, fnCustomerTransactions, fnParticularCustomer } from '../../api/private/customers/router';

export const userCustomersRouter = express.Router();


userCustomersRouter.get('/all', fnAllCustomers);

userCustomersRouter.get('/:id', fnParticularCustomer);

userCustomersRouter.get('/:id/transactions', fnCustomerTransactions);
