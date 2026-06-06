// Thin wrapper around the Chapa hosted-checkout API.
// Docs: https://developer.chapa.co/

const CHAPA_BASE = 'https://api.chapa.co/v1';

function getSecret(): string {
  const key = process.env.CHAPA_SECRET_KEY;
  if (!key) {
    throw new Error('CHAPA_SECRET_KEY is not set in the environment');
  }
  return key;
}

export interface InitializeParams {
  amount: number;
  currency?: string;
  email: string;
  firstName: string;
  lastName: string;
  txRef: string;
  callbackUrl: string;
  returnUrl: string;
  title?: string;
  description?: string;
}

export interface ChapaInitializeResponse {
  status: string;
  message: string;
  data: { checkout_url: string };
}

export interface ChapaVerifyResponse {
  status: string;
  message: string;
  data: {
    status: string; // "success" when paid
    amount: number;
    currency: string;
    tx_ref: string;
    reference?: string;
  } | null;
}

export async function initializeTransaction(params: InitializeParams): Promise<string> {
  const res = await fetch(`${CHAPA_BASE}/transaction/initialize`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${getSecret()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      amount: String(params.amount),
      currency: params.currency ?? 'ETB',
      email: params.email,
      first_name: params.firstName,
      last_name: params.lastName,
      tx_ref: params.txRef,
      callback_url: params.callbackUrl,
      return_url: params.returnUrl,
      customization: {
        // Chapa limits the title to 16 chars.
        title: (params.title ?? 'Event Tickets').slice(0, 16),
        description: params.description ?? 'Ticket purchase',
      },
    }),
  });

  const json = (await res.json()) as ChapaInitializeResponse;
  if (!res.ok || json.status !== 'success' || !json.data?.checkout_url) {
    throw new Error(json?.message || 'Failed to initialize Chapa transaction');
  }
  return json.data.checkout_url;
}

export async function verifyTransaction(txRef: string): Promise<ChapaVerifyResponse> {
  const res = await fetch(`${CHAPA_BASE}/transaction/verify/${encodeURIComponent(txRef)}`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${getSecret()}` },
    cache: 'no-store',
  });

  const json = (await res.json()) as ChapaVerifyResponse;
  if (!res.ok) {
    throw new Error(json?.message || 'Failed to verify Chapa transaction');
  }
  return json;
}

export function isPaid(verify: ChapaVerifyResponse): boolean {
  return verify.status === 'success' && verify.data?.status === 'success';
}
