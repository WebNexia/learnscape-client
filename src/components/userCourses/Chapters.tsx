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

		// Find which lesson ID is stored in sessionStorage
		let nextLessonIdToExpand: string | null = null;
		for (let i = 0; i < sessionStorage.length; i++) {
			const key = sessionStorage.key(i);
			if (key && key.startsWith('expand-chapter-for-lesson-')) {
				const storedValue = sessionStorage.getItem(key);
				if (storedValue === 'true') {
					nextLessonIdToExpand = key.replace('expand-chapter-for-lesson-', '');
					break;
				}
			}
		}

		if (nextLessonIdToExpand) {
			// Find which chapter contains this lesson
			course.chapters.forEach((chapter, index) => {
				if (!chapter || !chapter.lessons) return;
				const hasNextLesson = chapter.lessons.some((lesson) => lesson && lesson._id === nextLessonIdToExpand);
				if (hasNextLesson && chapterRefs.current[index]) {
					// Small delay to ensure refs are registered
					setTimeout(() => {
						chapterRefs.current[index]?.setExpanded(true);
						// Clear the sessionStorage after expanding
						sessionStorage.removeItem(`expand-chapter-for-lesson-${nextLessonIdToExpand}`);
					}, 100);
				}
			});
		}
	}, [course]);

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
						let nextChapterFirstLessonId: string = '';
						if (index + 1 < course?.chapters?.length) {
							nextChapterFirstLessonId = course?.chapters[index + 1].lessonIds[0];
						}
						return (
							<Chapter
								key={index}
								ref={(ref) => ref && registerChapterRef(index, ref)}
								chapter={chapter}
								course={course}
								isEnrolledStatus={isEnrolledStatus}
								nextChapterFirstLessonId={nextChapterFirstLessonId}
							/>
						);
					}
					return null;
				})}
		</Box>
	);
};

export default Chapters;
