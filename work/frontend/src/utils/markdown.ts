import { marked } from 'marked'
import DOMPurify from 'dompurify'

marked.setOptions({
  breaks: true,
  gfm: true,
})

export function renderMarkdown(text: string): string {
  const rawHtml = marked.parse(text) as string
  return DOMPurify.sanitize(rawHtml, {
    ALLOWED_TAGS: [
      'p', 'br', 'strong', 'em', 'code', 'pre', 'blockquote',
      'ul', 'ol', 'li', 'a', 'h1', 'h2', 'h3', 'del', 's',
    ],
    ALLOWED_ATTR: ['href', 'target', 'rel', 'class'],
    FORCE_BODY: true,
    ADD_ATTR: ['target'],
    FORBID_ATTR: ['style', 'onerror', 'onload'],
  })
}

export function extractUrls(text: string): string[] {
  const urlRegex = /(https?:\/\/[^\s<>"]+)/g
  return text.match(urlRegex) || []
}
