/**
 * Validation Middleware
 * Validates request data using express-validator
 */

const { body, param, validationResult } = require('express-validator');

/**
 * Handle validation errors
 */
function handleValidationErrors(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
}

/**
 * Validation rules for parent login
 */
const validateParentLogin = [
  body('kid_username')
    .trim()
    .notEmpty()
    .withMessage('kid_username is required')
    .isLength({ min: 1, max: 100 })
    .withMessage('kid_username must be between 1 and 100 characters'),
  
  body('parent_pin')
    .trim()
    .notEmpty()
    .withMessage('parent_pin is required')
    .isLength({ min: 4, max: 4 })
    .withMessage('parent_pin must be exactly 4 digits')
    .matches(/^\d+$/)
    .withMessage('parent_pin must contain only digits'),
  
  handleValidationErrors
];

/**
 * Validation rules for AI assistant
 */
const validateAIAssistant = [
  body('question')
    .trim()
    .notEmpty()
    .withMessage('question is required')
    .isLength({ min: 1, max: 500 })
    .withMessage('question must be between 1 and 500 characters'),
  
  body('context')
    .optional()
    .isObject()
    .withMessage('context must be an object'),
  
  body('conversationHistory')
    .optional()
    .isArray()
    .withMessage('conversationHistory must be an array'),
  
  handleValidationErrors
];

/**
 * Validation rules for user_id parameter
 */
const validateUserId = [
  param('user_id')
    .trim()
    .notEmpty()
    .withMessage('user_id is required')
    .isLength({ min: 1, max: 100 })
    .withMessage('user_id must be between 1 and 100 characters'),
  
  handleValidationErrors
];

/**
 * Validation rules for kid_username parameter
 */
const validateKidUsername = [
  param('kid_username')
    .trim()
    .notEmpty()
    .withMessage('kid_username is required')
    .isLength({ min: 1, max: 100 })
    .withMessage('kid_username must be between 1 and 100 characters'),
  
  handleValidationErrors
];

/**
 * Validation rules for kid setup
 */
const validateKidSetup = [
  body('kid_username')
    .trim()
    .notEmpty()
    .withMessage('kid_username is required')
    .isLength({ min: 1, max: 100 })
    .withMessage('kid_username must be between 1 and 100 characters'),
  
  handleValidationErrors
];

module.exports = {
  validateParentLogin,
  validateAIAssistant,
  validateUserId,
  validateKidUsername,
  validateKidSetup,
  handleValidationErrors
};

