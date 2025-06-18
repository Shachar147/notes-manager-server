"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateExistingNotesWithUserId = void 0;
class UpdateExistingNotesWithUserId {
    constructor() {
        this.name = 'UpdateExistingNotesWithUserId';
    }
    async up(queryRunner) {
        // Update all notes that don't have a userId to assign them to the specified user
        await queryRunner.query(`
            UPDATE "note" 
            SET "userId" = '4731a1fc-2608-46bb-879f-ace683f5f8e2' 
            WHERE "userId" IS NULL
        `);
    }
    async down(queryRunner) {
        // Revert: Set userId back to NULL for notes that were updated
        await queryRunner.query(`
            UPDATE "note" 
            SET "userId" = NULL 
            WHERE "userId" = '4731a1fc-2608-46bb-879f-ace683f5f8e2'
        `);
    }
}
exports.UpdateExistingNotesWithUserId = UpdateExistingNotesWithUserId;
