import Joi from 'joi';
import { Request, Response, NextFunction } from 'express';

const transactionSchema = Joi.object({
  transactionId: Joi.string().required().messages({
    'any.required': 'Transaction ID is required',
    'string.empty': 'Transaction ID cannot be empty',
  }),
  amount: Joi.number().required().messages({
    'number.base': 'Amount must be a valid number',
    'any.required': 'Amount is required',
  }),
  timestamp: Joi.date().iso().required().messages({
    'date.format': 'Timestamp must be a valid ISO 8601 date',
    'any.required': 'Timestamp is required',
  }),
  description: Joi.string().required().messages({
    'any.required': 'Description is required',
    'string.empty': 'Description cannot be empty',
  }),
  transactionType: Joi.string().valid('debit', 'credit').required().messages({
    'any.only': 'Transaction Type must be either debit or credit',
    'any.required': 'Transaction Type is required',
  }),
  accountNumber: Joi.string().required().messages({
    'string.min': 'Account Number is required',
    'any.required': 'Account Number is required',
  }),
});

export const validateTransaction = (req: Request, res: Response, next: NextFunction) => {
  const { error } = transactionSchema.validate(req.body);

  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }
  return next();
};
