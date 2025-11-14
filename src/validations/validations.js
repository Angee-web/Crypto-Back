import { body } from "express-validator";

// Enhanced validation rules for registration
export const registerValidation = [
    // Personal Information (Step 1)
    body('firstName')
      .trim()
      .notEmpty()
      .withMessage('First name is required')
      .isLength({ min: 2, max: 50 })
      .withMessage('First name must be between 2 and 50 characters'),
    
    body('lastName')
      .trim()
      .notEmpty()
      .withMessage('Last name is required')
      .isLength({ min: 2, max: 50 })
      .withMessage('Last name must be between 2 and 50 characters'),
      
    body('dateOfBirth')
      .isISO8601()
      .withMessage('Valid date of birth is required')
      .custom((value) => {
        const birthDate = new Date(value);
        const today = new Date();
        const age = today.getFullYear() - birthDate.getFullYear();
        if (age < 18) throw new Error('Must be at least 18 years old');
        if (age > 120) throw new Error('Invalid date of birth');
        return true;
      }),
      
    body('ssn')
      .matches(/^\d{3}-\d{2}-\d{4}$/)
      .withMessage('SSN must be in format XXX-XX-XXXX'),
      
    body('citizenshipStatus')
      .isIn(['us-citizen', 'permanent-resident', 'undocumented individual'])
      .withMessage('Valid citizenship status is required'),
    
    // Contact Information (Step 2)
    body('email')
      .trim()
      .isEmail()
      .withMessage('Please provide a valid email')
      .normalizeEmail(),
      
    body('phoneNumber')
      .matches(/^\(\d{3}\) \d{3}-\d{4}$/)
      .withMessage('Phone number must be in format (XXX) XXX-XXXX'),
      
    body('phoneType')
      .isIn(['mobile', 'home', 'work'])
      .withMessage('Valid phone type is required'),
      
    body('streetAddress')
      .trim()
      .notEmpty()
      .withMessage('Street address is required'),
      
    body('city')
      .trim()
      .notEmpty()
      .withMessage('City is required'),
      
    body('state')
      .notEmpty()
      .withMessage('State is required'),
      
    body('zipCode')
      .matches(/^\d{5}(-\d{4})?$/)
      .withMessage('Valid ZIP code is required'),
    
    // Security & Verification (Step 3)
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters long')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^+=<>(){}[\]|\\:";',./_~`-])/)
      .withMessage('Password must contain uppercase, lowercase, number, and special character'),
      
    body('securityQuestion')
      .isIn(['mothers-maiden-name', 'first-pet', 'birth-city', 'elementary-school', 'favorite-book'])
      .withMessage('Valid security question is required'),
      
    body('securityAnswer')
      .trim()
      .notEmpty()
      .withMessage('Security answer is required'),
    
    // Agreements
    body('termsAgreement')
      .equals('true')
      .withMessage('Terms agreement is required'),
      
    body('investmentAgreement')
      .equals('true')
      .withMessage('Investment agreement is required')
  ];
  
  export const loginValidation = [
    body('email')
      .trim()
      .isEmail()
      .withMessage('Please provide a valid email')
      .normalizeEmail(),
    
    body('password')
      .notEmpty()
      .withMessage('Password is required')
  ];