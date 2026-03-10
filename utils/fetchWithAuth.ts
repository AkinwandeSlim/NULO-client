export async function fetchWithAuth(
  url: string,
  token: string,
  options: RequestInit = {}
) {
  const headers = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // Create timeout controller
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

  const response = await fetch(url, {
    ...options,
    headers,
    signal: controller.signal
  });

  // Clear timeout if request completes
  clearTimeout(timeoutId);

  if (!response.ok) {
    throw new Error('Failed to fetch');
  }

  return response.json();
}
