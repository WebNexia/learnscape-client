/** Firebase Storage scope keys under editor-images/ */
export const lessonEditorScope = (lessonId: string) => `lessons/${lessonId}`;
export const questionEditorScope = (questionId: string) => `questions/${questionId}`;
export const courseEditorScope = (courseId: string) => `courses/${courseId}`;
export const documentEditorScope = (documentId: string) => `documents/${documentId}`;
export const emailEditorScope = (sessionId: string) => `emails/${sessionId}`;

/** Client-side MongoDB ObjectId for uploads before create API returns. */
export function generateMongoObjectId(): string {
	const timestamp = Math.floor(Date.now() / 1000)
		.toString(16)
		.padStart(8, '0');
	const random = Array.from(crypto.getRandomValues(new Uint8Array(8)))
		.map((b) => b.toString(16).padStart(2, '0'))
		.join('');
	return (timestamp + random).slice(0, 24);
}
