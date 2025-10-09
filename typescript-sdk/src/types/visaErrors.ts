export interface VisaError {
  name: string;
  retryable: boolean;
  http: number;
  code: string;
  rail?: string;
  corridor?: string;
  message: string;
  recommendedAction: string;
}

export interface ErrorMapping {
  [key: string]: VisaError;
}

export const VISA_ERROR_MAPPINGS: ErrorMapping = {
  // Network Errors
  'NETWORK_TIMEOUT': {
    name: 'NetworkTimeout',
    retryable: true,
    http: 408,
    code: 'TIMEOUT',
    message: 'Request timeout - network connectivity issue',
    recommendedAction: 'Retry with exponential backoff. Check network connectivity.'
  },
  'NETWORK_ERROR': {
    name: 'NetworkError',
    retryable: true,
    http: 503,
    code: 'NETWORK',
    message: 'Network connectivity error',
    recommendedAction: 'Retry with exponential backoff. Check network connectivity.'
  },

  // Authentication Errors
  'UNAUTHORIZED': {
    name: 'Unauthorized',
    retryable: false,
    http: 401,
    code: '01',
    message: 'Authentication failed - invalid credentials',
    recommendedAction: 'Check credentials and certificate configuration. Do not retry.'
  },
  'FORBIDDEN': {
    name: 'Forbidden',
    retryable: false,
    http: 403,
    code: '02',
    message: 'Access forbidden - insufficient permissions',
    recommendedAction: 'Check API permissions and program configuration. Do not retry.'
  },
  'CERTIFICATE_INVALID': {
    name: 'CertificateInvalid',
    retryable: false,
    http: 401,
    code: '03',
    message: 'Invalid client certificate',
    recommendedAction: 'Verify certificate paths, permissions, and modulus match. Do not retry.'
  },

  // Validation Errors
  'BAD_REQUEST': {
    name: 'BadRequest',
    retryable: false,
    http: 400,
    code: '10',
    message: 'Invalid request format or parameters',
    recommendedAction: 'Fix request format and parameters. Do not retry.'
  },
  'INVALID_PAN': {
    name: 'InvalidPan',
    retryable: false,
    http: 400,
    code: '11',
    message: 'Invalid PAN token format',
    recommendedAction: 'Validate PAN token format. Do not retry.'
  },
  'INVALID_AMOUNT': {
    name: 'InvalidAmount',
    retryable: false,
    http: 400,
    code: '12',
    message: 'Invalid transaction amount',
    recommendedAction: 'Validate transaction amount format and limits. Do not retry.'
  },
  'INVALID_CURRENCY': {
    name: 'InvalidCurrency',
    retryable: false,
    http: 400,
    code: '13',
    message: 'Unsupported currency code',
    recommendedAction: 'Use supported currency codes. Do not retry.'
  },
  'MISSING_REQUIRED_FIELD': {
    name: 'MissingRequiredField',
    retryable: false,
    http: 422,
    code: '14',
    message: 'Required field is missing',
    recommendedAction: 'Include all required fields. Do not retry.'
  },

  // Business Logic Errors
  'INSUFFICIENT_FUNDS': {
    name: 'InsufficientFunds',
    retryable: false,
    http: 400,
    code: '20',
    message: 'Insufficient funds for transaction',
    recommendedAction: 'Check account balance. Do not retry.'
  },
  'ACCOUNT_NOT_FOUND': {
    name: 'AccountNotFound',
    retryable: false,
    http: 404,
    code: '21',
    message: 'Account not found',
    recommendedAction: 'Verify account ID. Do not retry.'
  },
  'CARD_NOT_FOUND': {
    name: 'CardNotFound',
    retryable: false,
    http: 404,
    code: '22',
    message: 'Card not found',
    recommendedAction: 'Verify card token. Do not retry.'
  },
  'WALLET_NOT_FOUND': {
    name: 'WalletNotFound',
    retryable: false,
    http: 404,
    code: '23',
    message: 'Wallet not found',
    recommendedAction: 'Verify wallet ID. Do not retry.'
  },
  'ALIAS_NOT_FOUND': {
    name: 'AliasNotFound',
    retryable: false,
    http: 404,
    code: '24',
    message: 'Alias not found in directory',
    recommendedAction: 'Verify alias and alias type. Do not retry.'
  },

  // Transaction Errors
  'TRANSACTION_DECLINED': {
    name: 'TransactionDeclined',
    retryable: false,
    http: 400,
    code: '30',
    message: 'Transaction declined by issuer',
    recommendedAction: 'Contact issuer or try different card. Do not retry.'
  },
  'DUPLICATE_TRANSACTION': {
    name: 'DuplicateTransaction',
    retryable: false,
    http: 409,
    code: '31',
    message: 'Duplicate transaction detected',
    recommendedAction: 'Use different idempotency key. Do not retry.'
  },
  'TRANSACTION_EXPIRED': {
    name: 'TransactionExpired',
    retryable: false,
    http: 400,
    code: '32',
    message: 'Transaction has expired',
    recommendedAction: 'Create new transaction. Do not retry.'
  },
  'RECEIPT_REUSED': {
    name: 'ReceiptReused',
    retryable: false,
    http: 400,
    code: '33',
    message: 'Receipt already used',
    recommendedAction: 'Use different receipt. Do not retry.'
  },

  // Compliance Errors
  'COMPLIANCE_DENIED': {
    name: 'ComplianceDenied',
    retryable: false,
    http: 403,
    code: '40',
    message: 'Transaction denied by compliance checks',
    recommendedAction: 'Review compliance requirements. Do not retry.'
  },
  'SANCTIONS_MATCH': {
    name: 'SanctionsMatch',
    retryable: false,
    http: 403,
    code: '41',
    message: 'Sanctions screening match detected',
    recommendedAction: 'Review sanctions lists. Do not retry.'
  },
  'AML_ALERT': {
    name: 'AMLAlert',
    retryable: false,
    http: 403,
    code: '42',
    message: 'AML review required',
    recommendedAction: 'Complete AML review process. Do not retry.'
  },

  // FX Errors
  'FX_RATE_EXPIRED': {
    name: 'FXRateExpired',
    retryable: false,
    http: 400,
    code: '50',
    message: 'FX rate has expired',
    recommendedAction: 'Get new FX quote. Do not retry.'
  },
  'FX_RATE_NOT_FOUND': {
    name: 'FXRateNotFound',
    retryable: true,
    http: 404,
    code: '51',
    message: 'FX rate not available',
    recommendedAction: 'Retry with exponential backoff. Check FX service availability.'
  },
  'SLIPPAGE_EXCEEDED': {
    name: 'SlippageExceeded',
    retryable: false,
    http: 400,
    code: '52',
    message: 'FX rate slippage exceeds limits',
    recommendedAction: 'Get new FX quote with tighter slippage tolerance. Do not retry.'
  },

  // System Errors
  'ISSUER_UNAVAILABLE': {
    name: 'IssuerUnavailable',
    retryable: true,
    http: 503,
    code: '60',
    message: 'Issuer system temporarily unavailable',
    recommendedAction: 'Retry with exponential backoff. Check issuer system status.'
  },
  'ACQUIRER_UNAVAILABLE': {
    name: 'AcquirerUnavailable',
    retryable: true,
    http: 503,
    code: '61',
    message: 'Acquirer system temporarily unavailable',
    recommendedAction: 'Retry with exponential backoff. Check acquirer system status.'
  },
  'VISA_SYSTEM_ERROR': {
    name: 'VisaSystemError',
    retryable: true,
    http: 500,
    code: '62',
    message: 'Visa system error',
    recommendedAction: 'Retry with exponential backoff. Check Visa system status.'
  },
  'SERVICE_UNAVAILABLE': {
    name: 'ServiceUnavailable',
    retryable: true,
    http: 503,
    code: '63',
    message: 'Service temporarily unavailable',
    recommendedAction: 'Retry with exponential backoff. Check service status.'
  },

  // Rate Limiting
  'RATE_LIMIT_EXCEEDED': {
    name: 'RateLimitExceeded',
    retryable: true,
    http: 429,
    code: '70',
    message: 'Rate limit exceeded',
    recommendedAction: 'Retry with exponential backoff. Respect retry-after header.'
  },

  // MLE/JWE Errors
  'JWE_ENCRYPT_ERROR': {
    name: 'JWEEncryptError',
    retryable: false,
    http: 500,
    code: '80',
    message: 'JWE encryption failed',
    recommendedAction: 'Check encryption keys and payload. Do not retry.'
  },
  'JWE_DECRYPT_ERROR': {
    name: 'JWEDecryptError',
    retryable: false,
    http: 500,
    code: '81',
    message: 'JWE decryption failed',
    recommendedAction: 'Check decryption keys and payload. Do not retry.'
  },
  'JWKS_UNAVAILABLE': {
    name: 'JWKSUnavailable',
    retryable: true,
    http: 503,
    code: '82',
    message: 'JWKS service unavailable',
    recommendedAction: 'Retry with exponential backoff. Check JWKS service status.'
  },

  // Unknown Error
  'UNKNOWN_ERROR': {
    name: 'UnknownError',
    retryable: false,
    http: 500,
    code: '99',
    message: 'Unknown error occurred',
    recommendedAction: 'Contact support with error details. Do not retry.'
  }
};

export class VisaDirectError extends Error {
  public readonly detail: VisaError;
  public readonly httpStatus: number;
  public readonly visaCode: string;

  constructor(detail: VisaError, httpStatus: number, visaCode: string) {
    super(detail.message);
    this.name = detail.name;
    this.detail = detail;
    this.httpStatus = httpStatus;
    this.visaCode = visaCode;
  }

  get recommendedAction(): string {
    return this.detail.recommendedAction;
  }

  get isRetryable(): boolean {
    return this.detail.retryable;
  }
}

export function mapVisaError(
  httpStatus: number, 
  visaCode?: string, 
  message?: string, 
  context?: { rail?: string; corridor?: string }
): VisaError {
  // Try exact Visa code match first
  if (visaCode) {
    const exactMatch = Object.values(VISA_ERROR_MAPPINGS).find(error => error.code === visaCode);
    if (exactMatch) {
      return { 
        ...exactMatch, 
        corridor: context?.corridor, 
        rail: context?.rail 
      };
    }
  }

  // Fall back to HTTP status mapping
  const statusMappings: { [key: number]: string } = {
    400: 'BAD_REQUEST',
    401: 'UNAUTHORIZED',
    403: 'FORBIDDEN',
    404: 'ACCOUNT_NOT_FOUND',
    408: 'NETWORK_TIMEOUT',
    409: 'DUPLICATE_TRANSACTION',
    422: 'MISSING_REQUIRED_FIELD',
    429: 'RATE_LIMIT_EXCEEDED',
    500: 'VISA_SYSTEM_ERROR',
    503: 'SERVICE_UNAVAILABLE'
  };

  const errorKey = statusMappings[httpStatus] || 'UNKNOWN_ERROR';
  const mappedError = VISA_ERROR_MAPPINGS[errorKey];

  return {
    ...mappedError,
    corridor: context?.corridor,
    rail: context?.rail,
    message: message || mappedError.message
  };
}