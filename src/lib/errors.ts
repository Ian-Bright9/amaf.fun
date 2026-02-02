import { AnchorError } from '@coral-xyz/anchor'

export interface ParsedError {
  userMessage: string
  technicalDetails: string | null
  errorCode: string | null
}

export function parseError(error: any): ParsedError {
  if (!error) {
    return {
      userMessage: 'An unknown error occurred',
      technicalDetails: null,
      errorCode: null,
    }
  }

  if (error instanceof AnchorError) {
    return parseAnchorError(error)
  }

  if (error.logs) {
    return parseTransactionError(error)
  }

  if (error.message) {
    return parseGenericError(error)
  }

  return {
    userMessage: 'An unknown error occurred',
    technicalDetails: JSON.stringify(error, null, 2),
    errorCode: null,
  }
}

function parseAnchorError(error: AnchorError): ParsedError {
  const errorCode = error.error.errorCode ? error.error.errorCode.toString() : null
  const errorMessage = error.error.errorMessage || error.toString()

  let userMessage = errorMessage

  if (errorCode === 'MarketResolved') {
    userMessage = 'This market has already been resolved'
  } else if (errorCode === 'QuestionTooLong') {
    userMessage = 'Question exceeds maximum length (200 characters)'
  } else if (errorCode === 'DescriptionTooLong') {
    userMessage = 'Description exceeds maximum length (500 characters)'
  } else if (errorCode === 'InvalidMint') {
    userMessage = 'Invalid token mint address'
  } else if (errorCode === 'InvalidOwner') {
    userMessage = 'Invalid account ownership'
  } else if (errorCode === 'ClaimTooSoon') {
    userMessage = 'You must wait 24 hours between claims'
  } else if (errorCode === 'AlreadyClaimed') {
    userMessage = 'This bet has already been claimed'
  } else if (errorCode === 'NotWinner') {
    userMessage = 'You did not win this bet'
  } else if (errorCode === 'MarketNotResolved') {
    userMessage = 'Market has not been resolved yet'
  }

  return {
    userMessage,
    technicalDetails: `Anchor Error: ${errorMessage}\nCode: ${errorCode}\nProgram: ${error.program.toString()}`,
    errorCode,
  }
}

function parseTransactionError(error: any): ParsedError {
  let userMessage = 'Transaction failed'
  let technicalDetails = ''

  if (error.logs && error.logs.length > 0) {
    const lastLog = error.logs[error.logs.length - 1]
    technicalDetails += `Transaction Logs:\n${error.logs.join('\n')}\n\n`

    if (lastLog.includes('Program log: Error:')) {
      userMessage = lastLog.replace('Program log: Error: ', '')
    }
  }

  if (error.message) {
    technicalDetails += `Message: ${error.message}`
  }

  return {
    userMessage,
    technicalDetails,
    errorCode: null,
  }
}

function parseGenericError(error: any): ParsedError {
  let userMessage = error.message

  if (error.message.includes('User rejected')) {
    userMessage = 'Transaction was rejected by wallet'
  } else if (error.message.includes('insufficient funds')) {
    userMessage = 'Insufficient funds for transaction'
  } else if (error.message.includes('timeout')) {
    userMessage = 'Transaction timed out. Please try again'
  } else if (error.message.includes('network')) {
    userMessage = 'Network error. Please check your connection'
  }

  return {
    userMessage,
    technicalDetails: error.message,
    errorCode: null,
  }
}

export function formatErrorForUser(error: any): string {
  const parsed = parseError(error)
  return parsed.userMessage
}
