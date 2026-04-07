import { apiClient } from './client';

export interface CcWallet { balance: number; bank_name: string | null; account_holder: string | null; commission_rate: number; }
export interface CcTransaction { id: string; amount: number; tx_type: string; status: string; created_at: string; }

export async function getWallet(): Promise<CcWallet> { return (await apiClient.get('/cc/wallet')).data; }
export async function requestWithdrawal(amount: number): Promise<{ tx_id: string }> {
  return (await apiClient.post('/cc/wallet/withdraw', { amount })).data;
}
export async function listTransactions(): Promise<CcTransaction[]> {
  return (await apiClient.get('/cc/wallet/transactions')).data;
}
