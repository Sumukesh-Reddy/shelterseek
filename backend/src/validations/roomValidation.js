const { body } = require('express-validator');

const validateRoom = [
  body('title').notEmpty().withMessage('Title is required'),
  body('description').notEmpty().withMessage('Description is required'),
  body('price').isNumeric().withMessage('Price must be a number'),
  body('location').notEmpty().withMessage('Location is required'),
  body('propertyType').notEmpty().withMessage('Property type is required'),
  body('capacity').isNumeric().withMessage('Capacity must be a number'),
  body('bedrooms').isNumeric().withMessage('Bedrooms must be a number'),
  body('beds').isNumeric().withMessage('Beds must be a number'),
  body('maxdays').isNumeric().withMessage('Maximum days must be a number')
];

module.exports = {
  validateRoom
};