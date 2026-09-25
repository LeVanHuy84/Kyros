/**
 * RFC 7807 Problem Details for HTTP APIs.
 * Standard error response format matching Spring Boot backend GlobalExceptionHandler.
 */
export interface ValidationErrorItem {
  field: string;
  message: string;
  rejectedValue?: any;
}

export interface ProblemDetail {
  type?: string;
  title?: string;
  status: number;
  detail?: string;
  instance?: string;
  errorCode?: string;
  timestamp?: string;
  errors?: ValidationErrorItem[];
}
