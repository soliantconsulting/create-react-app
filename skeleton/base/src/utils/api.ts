export const apiUrl = (path: string): URL => new URL(path, import.meta.env.VITE_APP_API_ENDPOINT);
