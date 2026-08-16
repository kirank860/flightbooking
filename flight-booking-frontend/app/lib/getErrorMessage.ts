import { AxiosError } from 'axios';

export default function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof AxiosError) {
    const data = error.response?.data as { error?: string } | undefined;
    return data?.error || fallback;
  }
  return fallback;
}
