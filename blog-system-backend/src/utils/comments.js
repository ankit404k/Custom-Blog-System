/**
 * Comment validation utilities
 */

// Spam keywords for basic detection
const SPAM_KEYWORDS = [
  'buy now',
  'click here',
  'free money',
  'earn money',
  'make money',
  'limited time',
  'act now',
  'don\'t miss out',
  '100% free',
  'no cost',
  'no obligation',
  'bonus cash',
  'cash bonus',
  'credit card',
  'investment',
  'lottery',
  'winner',
  'you\'ve won',
  'congratulations',
  'dear friend',
  'cheap meds',
  'pharmacy',
  'weight loss',
  'work from home',
  'home based business',
];

// URLs patterns for detection
const URL_PATTERN = /(https?:\/\/[^\s]+)|(www\.[^\s]+)|([a-zA-Z0-9]+\.com[\/a-zA-Z0-9]*)/g;

/**
 * Check if comment content meets length requirements
 * @param {string} content - Comment content
 * @returns {object} - { valid: boolean, error?: string }
 */
const checkCommentLength = (content) => {
  if (!content || typeof content !== 'string') {
    return { valid: false, error: 'Comment content is required' };
  }

  const trimmedContent = content.trim();
  const length = trimmedContent.length;

  if (length < 5) {
    return { valid: false, error: 'Comment must be at least 5 characters long' };
  }

  if (length > 2000) {
    return { valid: false, error: 'Comment must not exceed 2000 characters' };
  }

  return { valid: true };
};

/**
 * Basic spam detection
 * @param {string} content - Comment content
 * @returns {object} - { isSpam: boolean, reasons: string[] }
 */
const detectSpam = (content) => {
  const reasons = [];
  const lowerContent = content.toLowerCase();

  // Check for excessive URLs
  const urls = content.match(URL_PATTERN);
  if (urls && urls.length > 2) {
    reasons.push('Too many URLs');
  }

  // Check for spam keywords
  SPAM_KEYWORDS.forEach(keyword => {
    if (lowerContent.includes(keyword.toLowerCase())) {
      reasons.push(`Contains spam keyword: "${keyword}"`);
    }
  });

  // Check for excessive capitalization
  const uppercaseChars = content.replace(/[^A-Z]/g, '').length;
  const totalChars = content.length;
  if (totalChars > 20 && (uppercaseChars / totalChars) > 0.7) {
    reasons.push('Excessive capitalization');
  }

  // Check for repetitive characters
  const repetitivePattern = /(.)\1{5,}/;
  if (repetitivePattern.test(content)) {
    reasons.push('Repetitive characters detected');
  }

  return {
    isSpam: reasons.length > 0,
    reasons
  };
};

/**
 * Comprehensive comment validation
 * @param {string} content - Comment content
 * @returns {object} - { valid: boolean, error?: string, warnings?: string[] }
 */
const validateComment = (content) => {
  // Check length
  const lengthCheck = checkCommentLength(content);
  if (!lengthCheck.valid) {
    return lengthCheck;
  }

  // Check for potentially harmful content
  const trimmedContent = content.trim();

  // Check for HTML/script tags
  const htmlPattern = /<[^>]*>/g;
  if (htmlPattern.test(trimmedContent)) {
    return { valid: false, error: 'HTML tags are not allowed in comments' };
  }

  // Check for JavaScript
  const jsPattern = /<script[\s>]/i;
  if (jsPattern.test(trimmedContent)) {
    return { valid: false, error: 'JavaScript is not allowed in comments' };
  }

  // Detect spam
  const spamCheck = detectSpam(trimmedContent);
  const warnings = spamCheck.isSpam ? spamCheck.reasons : [];

  return {
    valid: true,
    warnings: warnings.length > 0 ? warnings : undefined
  };
};

/**
 * Sanitize comment content (remove potentially harmful content)
 * @param {string} content - Comment content
 * @returns {string} - Sanitized content
 */
const sanitizeComment = (content) => {
  if (!content) return '';

  let sanitized = content
    .replace(/<script[\s>][^<]*<\/script>/gi, '')
    .replace(/<[^>]+>/g, '') // Remove HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim();

  return sanitized;
};

/**
 * Check for duplicate comments from same user
 * @param {object} models - Database models
 * @param {number} userId - User ID
 * @param {string} content - Comment content
 * @param {number} postId - Post ID
 * @returns {Promise<boolean>} - True if duplicate found within 10 minutes
 */
const isDuplicateComment = async (models, userId, content, postId) => {
  try {
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    const recentComment = await models.Comment.findRecentByUser(
      userId,
      postId,
      tenMinutesAgo
    );

    if (recentComment && recentComment.content.trim().toLowerCase() === content.trim().toLowerCase()) {
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error checking duplicate comment:', error);
    return false;
  }
};

module.exports = {
  checkCommentLength,
  detectSpam,
  validateComment,
  sanitizeComment,
  isDuplicateComment,
  SPAM_KEYWORDS,
};
