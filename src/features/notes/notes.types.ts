export interface CreateNoteDto {
    title: string;
    content: string;
}

export interface NoteInterface {
    id: string;
    title: string;
    content: string;
    createdAt: string;
    updatedAt: string | undefined;
}