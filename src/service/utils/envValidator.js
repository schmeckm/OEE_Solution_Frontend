export function validateEnvVar(variable, variableName) {
    if (!variable) {
        throw new Error(`Missing required environment variable: ${variableName}`);
    }
    return variable;
}
