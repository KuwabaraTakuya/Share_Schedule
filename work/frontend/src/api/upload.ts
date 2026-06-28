import { apiRequestFormData, apiRequest } from './client'
import type { Attachment, SafetyResult } from '../types'

export async function uploadFile(
  file: File,
  type: 'image' | 'file',
): Promise<Attachment> {
  const formData = new FormData()
  formData.append('file', file)
  return apiRequestFormData<Attachment>(`/api/v1/upload/${type}`, formData)
}

export async function checkUrlSafety(url: string): Promise<SafetyResult> {
  return apiRequest<SafetyResult>('/api/v1/url/check', {
    method: 'POST',
    body: JSON.stringify({ url }),
  })
}
