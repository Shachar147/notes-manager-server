import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateExistingNotesWithUserId1750265015000 implements MigrationInterface {
    name = 'UpdateExistingNotesWithUserId1750265015000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Update all notes that don't have a userId to assign them to the specified user
        await queryRunner.query(`
            UPDATE "note" 
            SET "userId" = '4731a1fc-2608-46bb-879f-ace683f5f8e2' 
            WHERE "userId" IS NULL
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Revert: Set userId back to NULL for notes that were updated
        await queryRunner.query(`
            UPDATE "note" 
            SET "userId" = NULL 
            WHERE "userId" = '4731a1fc-2608-46bb-879f-ace683f5f8e2'
        `);
    }
} 