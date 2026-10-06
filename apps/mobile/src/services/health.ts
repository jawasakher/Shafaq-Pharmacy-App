import { API_BASE_URL } from "./api";

export async function testBackendConnection(): Promise<string> {
  const response = await fetch(API_BASE_URL.replace("/api/v1", ""));

  if (!response.ok) {
    throw new Error(`Backend returned ${response.status}`);
  }

  return response.text();
}
