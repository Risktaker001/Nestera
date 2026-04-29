export const E2EFactory = {
  authPayload: () => ({
    email: `e2e_${Date.now()}@example.com`,
    password: 'StrongPass123!',
    firstName: 'E2E',
    lastName: 'User',
  }),
  walletLinkPayload: () => ({
    address: 'GBRPYHIL2C2YJ7Y3A4YQ7QO6FSVUIZXHTU2JZ5XW5ITQMRWJQN6M5J7N',
    signature: 'test-signature',
    nonce: `nonce-${Date.now()}`,
  }),
  savingsSubscriptionPayload: (productId: string) => ({ productId, amount: 100 }),
  withdrawalPayload: (subscriptionId: string) => ({ subscriptionId, amount: 50 }),
  governanceProposalPayload: () => ({
    title: 'E2E Governance Proposal',
    description: 'Proposal created by e2e tests',
  }),
  votePayload: () => ({ support: true }),
};
