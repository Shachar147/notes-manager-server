import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUniqueConstraintToNoteEmbedding1750534861284 implements MigrationInterface {
    name = 'AddUniqueConstraintToNoteEmbedding1750534861284'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "note_embedding" DROP CONSTRAINT "FK_04c5a3ce7813e0348f87ac6f567"`);
        await queryRunner.query(`ALTER TABLE "note_embedding" ADD CONSTRAINT "UQ_04c5a3ce7813e0348f87ac6f567" UNIQUE ("noteId")`);
        await queryRunner.query(`ALTER TABLE "note_embedding" ADD CONSTRAINT "FK_04c5a3ce7813e0348f87ac6f567" FOREIGN KEY ("noteId") REFERENCES "note"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "note_embedding" DROP CONSTRAINT "FK_04c5a3ce7813e0348f87ac6f567"`);
        await queryRunner.query(`ALTER TABLE "note_embedding" DROP CONSTRAINT "UQ_04c5a3ce7813e0348f87ac6f567"`);
        await queryRunner.query(`ALTER TABLE "note_embedding" ADD CONSTRAINT "FK_04c5a3ce7813e0348f87ac6f567" FOREIGN KEY ("noteId") REFERENCES "note"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
