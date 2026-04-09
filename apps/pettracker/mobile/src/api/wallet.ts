import { apiClient } from './client';

export interface Wallet {
  balance: number;
  bank_name: string | null;
  account_holder: string | null;
  commission_rate: number;
}

export interface WalletTransaction {
  id: string;
  amount: number;
  tx_type: string;
  status: string;
  created_at: string;
  gross_amount: number;
  platform_fee: number;
  description: string | null;
}

export async function getWallet(): Promise<Wallet> {
  const resp = await apiClient.get('/pt/wallet');
  return resp.data;
}

export async function listTransactions(): Promise<WalletTransaction[]> {
  const resp = await apiClient.get('/pt/wallet/transactions');
  return resp.data;
}

export async function requestWithdrawal(amount: number): Promise<{ tx_id: string }> {
  const resp = await apiClient.post('/pt/wallet/withdraw', { amount });
  return resp.data;
}

export async function exportTransactionsCsv(month: string): Promise<string> {
  const resp = await apiClient.get('/pt/wallet/export', {
    params: { month },
    responseType: 'text',
  });
  return typeof resp.data === 'string' ? resp.data : JSON.stringify(resp.data);
}
