import { useAuthStore } from '../store/auth.store'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080'

class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const idToken = useAuthStore.getState().idToken

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }

  if (idToken) {
    headers['Authorization'] = `Bearer ${idToken}`
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  })

  if (!response.ok) {
    let errorMessage = `HTTP ${response.status}`
    try {
      const errorData = await response.json()
      errorMessage = errorData.error || errorMessage
    } catch {
      // ignore parse error
    }
    throw new ApiError(response.status, errorMessage)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return response.json()
}

export async function apiRequestFormData<T>(
  path: string,
  formData: FormData,
): Promise<T> {
  const idToken = useAuthStore.getState().idToken

  const headers: Record<string, string> = {}
  if (idToken) {
    headers['Authorization'] = `Bearer ${idToken}`
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers,
    body: formData,
  })

  if (!response.ok) {
    let errorMessage = `HTTP ${response.status}`
    try {
      const errorData = await response.json()
      errorMessage = errorData.error || errorMessage
    } catch {
      // ignore parse error
    }
    throw new ApiError(response.status, errorMessage)
  }

  return response.json()
}

export { ApiError }
