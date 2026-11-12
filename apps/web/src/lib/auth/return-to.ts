export function safeReturnTo(value: string | null) {
  if (!value || !value.startsWith('/') || value.startsWith('//') || value.includes('\\')) {
    return '/gallery';
  }

  try {
    const url = new URL(value, 'https://culturio.invalid');
    return url.origin === 'https://culturio.invalid'
      ? `${url.pathname}${url.search}${url.hash}`
      : '/gallery';
  } catch {
    return '/gallery';
  }
}
