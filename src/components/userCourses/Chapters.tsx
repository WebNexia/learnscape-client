import { Box, Button, Stack } from '@mui/material';
import { ExpandMore, ExpandLess } from '@mui/icons-material';
import { SingleCourse } from '../../interfaces/course';
import Chapter, { ChapterRef } from './Chapter';
import { useContext, useState, useRef, useCallback, useEffect } from 'react';
import { MediaQueryContext } from '../../contexts/MediaQueryContextProvider';
import theme from '../../themes';

interface ChaptersProps {
	course: SingleCourse;
	isEnrolledStatus: boolean;
}

const Chapters = ({ course, isEnrolledStatus }: ChaptersProps) => {
	const { isRotatedMedium, isSmallScreen } = useContext(MediaQueryContext);
	const isMobileSize = isRotatedMedium || isSmallScreen;
	const [allExpanded, setAllExpanded] = useState<boolean>(false);
	const chapterRefs = useRef<{ [key: number]: ChapterRef }>({});

	const validChapters = course?.chapters?.filter((chapter) => chapter !== null && chapter.lessonIds && chapter.lessonIds.length > 0) || [];

	const handleExpandAll = useCallback(() => {
		// Set all chapters to expanded state
		Object.values(chapterRefs.current).forEach((ref) => {
			if (ref) {
				ref.setExpanded(true);
			}
		});
		setAllExpanded(true);
	}, []);

	const handleCollapseAll = useCallback(() => {
		// Set all chapters to collapsed state
		Object.values(chapterRefs.current).forEach((ref) => {
			if (ref) {
				ref.setExpanded(false);
			}
		});
		setAllExpanded(false);
	}, []);

	const registerChapterRef = useCallback((index: number, ref: ChapterRef) => {
		chapterRefs.current[index] = ref;
	}, []);

	// Auto-expand chapter containing the next lesson after lesson completion
	useEffect(() => {
		if (!course?.chapters) return;

		// First, try chapter-id based expansion (most robust)
		let chapterIdToExpand: string | null = null;
		for (let i = sessionStorage.length - 1; i >= 0; i--) {
			const key = sessionStorage.key(i);
			if (key && key.startsWith('expand-chapter-by-id-') && sessionStorage.getItem(key) === 'true') {
				chapterIdToExpand = key.replace('expand-chapter-by-id-', '');
				break;
			}
		}

		if (chapterIdToExpand) {
			course.chapters.forEach((chapter, index) => {
				if (!chapter) return;
				const currentChapterId = (chapter as any)._id || (chapter as any).chapterId;
				if (currentChapterId === chapterIdToExpand && chapterRefs.current[index]) {
					setTimeout(() => {
						chapterRefs.current[index]?.setExpanded(true);
						sessionStorage.removeItem(`expand-chapter-by-id-${chapterIdToExpand}`);
					}, 100);
				}
			});
			return;
		}

		// Build a set of lesson IDs that belong to this course
		const currentCourseLessonIds = new Set(
			course.chapters
				.flatMap((chapter) => (chapter?.lessons || []).map((lesson) => lesson?._id))
				.filter((lessonId): lessonId is string => Boolean(lessonId))
		);

		// Collect all expansion requests from sessionStorage
		const expansionRequests: { key: string; lessonId: string }[] = [];
		for (let i = 0; i < sessionStorage.length; i++) {
			const key = sessionStorage.key(i);
			if (key && key.startsWith('expand-chapter-for-lesson-')) {
				const storedValue = sessionStorage.getItem(key);
				if (storedValue === 'true') {
					expansionRequests.push({
						key,
						lessonId: key.replace('expand-chapter-for-lesson-', ''),
					});
				}
			}
		}

		// Prefer the most recently added matching key (reverse order)
		const matchingRequest = [...expansionRequests]
			.reverse()
			.find((request) => currentCourseLessonIds.has(request.lessonId));

		if (!matchingRequest) return;

		// Find and expand the chapter containing the matched lesson
		course.chapters.forEach((chapter, index) => {
			if (!chapter || !chapter.lessons) return;
			const hasNextLesson = chapter.lessons.some((lesson) => lesson && lesson._id === matchingRequest.lessonId);
			if (hasNextLesson && chapterRefs.current[index]) {
				// Small delay to ensure refs are registered
				setTimeout(() => {
					chapterRefs.current[index]?.setExpanded(true);
					// Clear only the key that has been consumed
					sessionStorage.removeItem(matchingRequest.key);
				}, 100);
			}
		});
	}, [course]);

	let visibleChapterIndex = -1;

	return (
		<Box sx={{ width: isMobileSize ? '90%' : '85%', marginBottom: isEnrolledStatus ? '0rem' : '2rem' }}>
			{/* Chapter Controls Header */}
			{validChapters.length > 1 && (
				<Box sx={{ marginBottom: '1.5rem' }}>
					<Stack
						direction='row'
						justifyContent='flex-end'
						alignItems='center'
						spacing={2}
						sx={{
							borderRadius: '0.35rem',
						}}>
						<Stack direction='row' spacing={1}>
							<Button
								variant='outlined'
								size='small'
								startIcon={<ExpandMore />}
								onClick={handleExpandAll}
								disabled={allExpanded}
								sx={{
									'fontSize': isMobileSize ? '0.55rem' : '0.7rem',
									'padding': isMobileSize ? '0.25rem 0.5rem' : '0.5rem 1rem',
									'minWidth': 'auto',
									'borderColor': theme.palette.primary.main,
									'color': theme.palette.primary.main,
									'fontWeight': 600,
									'&:hover': {
										backgroundColor: theme.palette.primary.main,
										color: 'white',
										borderColor: theme.palette.primary.main,
									},
									'&:disabled': {
										opacity: 0.4,
										color: theme.palette.text.disabled,
										borderColor: theme.palette.text.disabled,
									},
								}}>
								Expand All
							</Button>
							<Button
								variant='outlined'
								size='small'
								startIcon={<ExpandLess />}
								onClick={handleCollapseAll}
								disabled={!allExpanded}
								sx={{
									'fontSize': isMobileSize ? '0.55rem' : '0.7rem',
									'padding': isMobileSize ? '0.25rem 0.5rem' : '0.5rem 1rem',
									'minWidth': 'auto',
									'borderColor': theme.palette.primary.main,
									'color': theme.palette.primary.main,
									'fontWeight': 600,
									'&:hover': {
										backgroundColor: theme.palette.primary.main,
										color: 'white',
										borderColor: theme.palette.primary.main,
									},
									'&:disabled': {
										opacity: 0.4,
										color: theme.palette.text.disabled,
										borderColor: theme.palette.text.disabled,
									},
								}}>
								Collapse All
							</Button>
						</Stack>
					</Stack>
				</Box>
			)}

			{/* Chapters List */}
			{course &&
				course?.chapters &&
				course?.chapterIds &&
				course?.chapterIds.length !== 0 &&
				course?.chapters?.map((chapter, index) => {
					if (chapter !== null && chapter.lessonIds && chapter.lessonIds.length > 0) {
						visibleChapterIndex += 1;
						let nextChapterFirstLessonId: string = '';
						// Find the first valid lesson in the next available chapter (skip empty/null chapters)
						for (let nextIndex = index + 1; nextIndex < course.chapters.length; nextIndex++) {
							const nextChapter = course.chapters[nextIndex];
							if (!nextChapter) continue;
							const firstValidNextChapterLesson = nextChapter.lessons?.find((lesson) => lesson && lesson._id);
							if (firstValidNextChapterLesson?._id) {
								nextChapterFirstLessonId = firstValidNextChapterLesson._id;
								break;
							}
						}
						return (
							<Chapter
								key={index}
								ref={(ref) => ref && registerChapterRef(index, ref)}
								chapter={chapter}
								course={course}
								isEnrolledStatus={isEnrolledStatus}
								nextChapterFirstLessonId={nextChapterFirstLessonId}
								isAlternateHeaderTone={visibleChapterIndex % 2 === 1}
							/>
						);
					}
					return null;
				})}
		</Box>
	);
};

export default Chapters;
