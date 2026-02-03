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
<<<<<<< HEAD
    userMessage = 'Invalid token mint address. Please contact support'
  } else if (errorCode === 'InvalidOwner') {
    userMessage = 'Token account ownership verification failed'
  } else if (errorCode === 'ClaimTooSoon') {
    userMessage = 'You must wait 24 hours between claims. Check the countdown timer above'
=======
    userMessage = 'Invalid token mint address'
  } else if (errorCode === 'InvalidOwner') {
    userMessage = 'Invalid account ownership'
  } else if (errorCode === 'ClaimTooSoon') {
    userMessage = 'You must wait 24 hours between claims'
>>>>>>> main
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
<<<<<<< HEAD
      const errorMsg = lastLog.replace('Program log: Error: ', '')
      userMessage = errorMsg

      if (errorMsg.includes('ClaimTooSoon')) {
        userMessage = 'You must wait 24 hours between claims. Please check the countdown timer'
      } else if (errorMsg.includes('Custom program error:')) {
        userMessage = 'A program error occurred. Please try again'
      }
=======
      userMessage = lastLog.replace('Program log: Error: ', '')
>>>>>>> main
    }
  }

  if (error.message) {
    technicalDetails += `Message: ${error.message}`
<<<<<<< HEAD

    if (error.message.includes('insufficient')) {
      userMessage = 'Insufficient funds for transaction'
    }
=======
>>>>>>> main
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
<<<<<<< HEAD
    userMessage = 'Transaction was cancelled. Please approve the transaction in your wallet'
  } else if (error.message.includes('User cancelled')) {
    userMessage = 'Transaction was cancelled in your wallet'
  } else if (error.message.includes('insufficient funds') || error.message.includes('insufficient SOL')) {
    userMessage = 'Insufficient SOL for transaction fee. Please get devnet SOL at https://faucet.solana.com'
  } else if (error.message.includes('timeout')) {
    userMessage = 'Transaction timed out. Please check your network and try again'
  } else if (error.message.includes('network') || error.message.includes('Network')) {
    userMessage = 'Network error. Please check your internet connection and try again'
  } else if (error.message.includes('blockhash')) {
    userMessage = 'Transaction expired. Please try again'
  } else if (error.message.includes('nonce')) {
    userMessage = 'Transaction order error. Please try again'
  } else if (error.message.includes('Failed to fetch') || error.message.includes('ECONNREFUSED')) {
        userMessage = 'Cannot connect to Solana network. Please check your internet connection'
      } else if (error.message.includes('Transaction simulation failed')) {
        userMessage = 'Transaction simulation failed. Please try again later'
      } else if (error.message.includes('already in use') || error.message.includes('AlreadyInUse')) {
        userMessage = 'Account already initialized. You can claim again in 24 hours. Please check the countdown timer above.'
      }
=======
    userMessage = 'Transaction was rejected by wallet'
  } else if (error.message.includes('insufficient funds')) {
    userMessage = 'Insufficient funds for transaction'
  } else if (error.message.includes('timeout')) {
    userMessage = 'Transaction timed out. Please try again'
  } else if (error.message.includes('network')) {
    userMessage = 'Network error. Please check your connection'
  }
>>>>>>> main

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
