import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Adds btree indexes for hot filters and joins (#660).
 *
 * `users.email`, `users.publicKey`, `users.walletAddress` already have btree
 * indexes via their UNIQUE constraints, so no extra single-column indexes are
 * created on `users` to avoid duplication.
 */
export class AddFrequentQueryIndexes1800000000000 implements MigrationInterface {
  name = 'AddFrequentQueryIndexes1800000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id_status
        ON user_subscriptions ("userId", status);
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_user_subscriptions_product_id_status
        ON user_subscriptions ("productId", status);
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id_product_id
        ON user_subscriptions ("userId", "productId");
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_savings_goals_user_id_status
        ON savings_goals ("userId", status);
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_transactions_user_id_status
        ON transactions ("userId", status);
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_transactions_status
        ON transactions (status);
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_governance_proposals_status
        ON governance_proposals (status);
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_governance_proposals_status_on_chain_id
        ON governance_proposals (status, "onChainId");
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_votes_proposal_id_wallet_address
        ON votes ("proposalId", "walletAddress");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS idx_votes_proposal_id_wallet_address;`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS idx_governance_proposals_status_on_chain_id;`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS idx_governance_proposals_status;`,
    );
    await queryRunner.query(`DROP INDEX IF EXISTS idx_transactions_status;`);
    await queryRunner.query(
      `DROP INDEX IF EXISTS idx_transactions_user_id_status;`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS idx_savings_goals_user_id_status;`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS idx_user_subscriptions_user_id_product_id;`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS idx_user_subscriptions_product_id_status;`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS idx_user_subscriptions_user_id_status;`,
    );
  }
}
