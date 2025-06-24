import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCascadeDeleteToNoteEmbedding1750571749637 implements MigrationInterface {
    name = 'AddCascadeDeleteToNoteEmbedding1750571749637'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "note_embedding" DROP CONSTRAINT "FK_04c5a3ce7813e0348f87ac6f567"`);
        await queryRunner.query(`ALTER TABLE "note_embedding" ADD CONSTRAINT "FK_04c5a3ce7813e0348f87ac6f567" FOREIGN KEY ("noteId") REFERENCES "note"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "note_embedding" DROP CONSTRAINT "FK_04c5a3ce7813e0348f87ac6f567"`);
        await queryRunner.query(`ALTER TABLE "note_embedding" ADD CONSTRAINT "FK_04c5a3ce7813e0348f87ac6f567" FOREIGN KEY ("noteId") REFERENCES "note"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
