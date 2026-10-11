type ChapterLike = {
	_id?: string;
	chapterId?: string;
	lessons?: Array<{ _id?: string } | null> | null;
};

type CourseLike = {
	chapters?: ChapterLike[] | null;
	openThroughChapterCount?: number | null;
};

export const CHAPTER_RELEASE_HOLD_COPY = {
	title: 'Next chapter is locked / Sonraki bölüm kilitli',
	en: 'You have completed the lessons that are open. The next chapter is not available yet.',
	tr: 'Açık olan dersleri tamamladınız. Sonraki bölüm henüz açılmadı.',
};

export function chapterIdOf(chapter: { _id?: string; chapterId?: string } | null | undefined): string {
	return String(chapter?._id ?? chapter?.chapterId ?? '');
}

/** null means every chapter is open. */
export function openThroughLimit(course: { openThroughChapterCount?: number | null } | null | undefined): number | null {
	const raw = course?.openThroughChapterCount;
	if (raw == null) return null;
	const limit = Number(raw);
	if (!Number.isInteger(limit) || limit < 1) return null;
	return limit;
}

export function isChapterIndexOpen(limit: number | null, chapterIndex: number): boolean {
	if (limit == null) return true;
	return chapterIndex >= 0 && chapterIndex < limit;
}

export function findLessonChapterIndex(chapters: ChapterLike[] | null | undefined, lessonId: string): number {
	if (!chapters?.length || !lessonId) return -1;
	return chapters.findIndex((chapter) => (chapter?.lessons || []).some((lesson) => lesson && lesson._id === lessonId));
}

export function isLessonChapterOpen(course: CourseLike | null | undefined, lessonId: string | null | undefined): boolean {
	if (!course || !lessonId) return true;
	const chapterIndex = findLessonChapterIndex(course.chapters, lessonId);
	if (chapterIndex < 0) return true;
	return isChapterIndexOpen(openThroughLimit(course), chapterIndex);
}

export function resolveNextLearnerLesson(
	course: CourseLike | null | undefined,
	lessonId: string | undefined,
	chapterIdFromUrl?: string
): { nextLessonId: string | null; awaitingChapterRelease: boolean } {
	const chapters = course?.chapters || [];
	if (!lessonId || chapters.length === 0) {
		return { nextLessonId: null, awaitingChapterRelease: false };
	}

	const limit = openThroughLimit(course);
	const searchChapters = chapterIdFromUrl ? chapters.filter((chapter) => chapterIdOf(chapter) === chapterIdFromUrl) : chapters;

	for (const chapter of searchChapters) {
		const validLessons = (chapter?.lessons || []).filter((lesson) => lesson && lesson._id);
		const currentIndex = validLessons.findIndex((lesson) => lesson && lesson._id === lessonId);
		if (currentIndex === -1) continue;

		const absoluteIndex = chapters.indexOf(chapter);
		const currentOpen = isChapterIndexOpen(limit, absoluteIndex);

		if (currentIndex < validLessons.length - 1) {
			if (!currentOpen) return { nextLessonId: null, awaitingChapterRelease: true };
			return { nextLessonId: validLessons[currentIndex + 1]?._id || null, awaitingChapterRelease: false };
		}

		for (let nextIndex = absoluteIndex + 1; nextIndex < chapters.length; nextIndex++) {
			const firstLesson = (chapters[nextIndex]?.lessons || []).find((lesson) => lesson && lesson._id);
			if (!firstLesson?._id) continue;
			if (!isChapterIndexOpen(limit, nextIndex)) {
				return { nextLessonId: null, awaitingChapterRelease: true };
			}
			return { nextLessonId: firstLesson._id, awaitingChapterRelease: false };
		}

		return { nextLessonId: null, awaitingChapterRelease: false };
	}

	return { nextLessonId: null, awaitingChapterRelease: false };
}
