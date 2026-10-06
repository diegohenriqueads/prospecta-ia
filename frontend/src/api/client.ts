// Camada centralizada de comunicação com o backend.
// Toda a aplicação deve importar de app/api/*, nunca chamar fetch()
// diretamente em um componente nem hardcodar uma URL.

const API_URL = import.meta.env.VITE_API_URL;

if (!API_URL) {
  // Falha alto e cedo: melhor um erro claro no console do que requests
  // silenciosamente indo para "undefined/api/...".
  // eslint-disable-next-line no-console
  console.error(
    "VITE_API_URL não está configurada. Crie um arquivo .env a partir de .env.example."
  );
}

export class ApiError extends Error {
  status: number;
  detail: string;

  constructor(status: number, detail: string) {
    super(detail);
    this.name = "ApiError";
    this.status = status;
    this.detail = detail;
  }
}

interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  params?: Record<string, string | number | boolean | undefined>;
}

function buildUrl(path: string, params?: RequestOptions["params"]): string {
  const url = new URL(`${API_URL}${path}`);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== "") {
        url.searchParams.set(key, String(value));
      }
    }
  }
  return url.toString();
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, params } = options;

  let response: Response;
  try {
    response = await fetch(buildUrl(path, params), {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(
      0,
      "Não foi possível conectar à API. Verifique se o backend está rodando e se VITE_API_URL está correto."
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  let data: unknown = null;
  const text = await response.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      // resposta não-JSON; segue com data = null
    }
  }

  if (!response.ok) {
    const detail =
      (data as { detail?: string } | null)?.detail ??
      `Erro ${response.status} ao comunicar com a API.`;
    throw new ApiError(response.status, detail);
  }

  return data as T;
}
