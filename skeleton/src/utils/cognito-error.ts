const messages: Record<string, string> = {
    UsernameExistsException: "A user with this email address already exists.",
    AliasExistsException: "Another user already uses this email address.",
    UserNotFoundException: "The user no longer exists.",
    GroupExistsException: "A role with this name already exists.",
    ResourceNotFoundException: "The requested resource no longer exists.",
    InvalidPasswordException: "The password does not meet the password policy.",
    AccessDeniedException: "You are not authorized to perform this action.",
    TooManyRequestsException: "Too many requests, please try again in a moment.",
    LimitExceededException: "Too many requests, please try again in a moment.",
    CodeDeliveryFailureException: "The email could not be delivered.",
};

// Cognito returns human-readable messages for these. NotAuthorizedException is used for user state
// problems too (e.g. "User password cannot be reset in the current state"), not only permissions.
const passThroughErrors = new Set([
    "InvalidParameterException",
    "NotAuthorizedException",
    "UnsupportedUserStateException",
]);

/**
 * Turns an AWS SDK error into a message suitable for a snackbar.
 */
export const getCognitoErrorMessage = (error: unknown, fallback: string): string => {
    if (!(error instanceof Error)) {
        return fallback;
    }

    const message = messages[error.name];

    if (message) {
        return message;
    }

    if (passThroughErrors.has(error.name) && error.message) {
        return `${fallback}: ${error.message}`;
    }

    return fallback;
};
