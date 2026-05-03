// B-1 smoke test — verifies jest + RNTL + setup.ts load correctly.

describe('PT mobile test infrastructure', () => {
  it('loads without crashing', () => {
    expect(true).toBe(true);
  });

  it('has API client mock available', () => {
    const client = require('../api/client');
    expect(client.apiClient).toBeDefined();
    expect(typeof client.apiClient.get).toBe('function');
  });

  it('has walker API mock returning insurance fields', async () => {
    const walkers = require('../api/walkers');
    const profile = await walkers.getWalkerProfile('w-1');
    expect(profile.has_insurance).toBe(true);
    expect(profile.insurance_expiry).toBe('2027-04-24');
  });
});
