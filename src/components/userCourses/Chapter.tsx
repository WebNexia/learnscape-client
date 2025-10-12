import { Box, Typography, IconButton, Collapse, Chip } from '@mui/material';
import { ExpandMore, PlayCircleOutline } from '@mui/icons-material';
import Lesson from './Lesson';
import { LessonById } from '../../interfaces/lessons';
import { ChapterLessonData } from '../../pages/AdminCourseEditPage';
import { useContext, useState, useMemo, forwardRef, useImperativeHandle } from 'react';
import { MediaQueryContext } from '../../contexts/MediaQueryContextProvider';
import { UserLessonDataStorage } from '../../contexts/UserCourseLessonDataContextProvider';
import theme from '../../themes';

interface ChapterProps {
	chapter: ChapterLessonData;
	isEnrolledStatus: boolean;
	nextChapterFirstLessonId: string;
}

export interface ChapterRef {
	toggleExpanded: () => void;
	setExpanded: (expanded: boolean) => void;
}

const Chapter = forwardRef<ChapterRef, ChapterProps>(({ chapter, isEnrolledStatus, nextChapterFirstLessonId }, ref) => {
	const { isRotatedMedium, isSmallScreen } = useContext(MediaQueryContext);
	const isMobileSize = isRotatedMedium || isSmallScreen;
	const [isExpanded, setIsExpanded] = useState<boolean>(false); // Default to expanded

	// Calculate progress for this chapter
	const progressData = useMemo(() => {
		if (!isEnrolledStatus || !chapter?.lessons) {
			return { completed: 0, total: 0, percentage: 0 };
		}

		const currentUserLessonData: string | null = localStorage.getItem('userLessonData');
		let parsedUserLessonData: UserLessonDataStorage[] = [];
		if (currentUserLessonData !== null) {
			parsedUserLessonData = JSON.parse(currentUserLessonData);
		}

		const validLessons = chapter.lessons.filter((lesson) => lesson !== null);
		const completedLessons = validLessons.filter((lesson) => {
			return parsedUserLessonData.some((data) => data.lessonId === lesson._id && data.isCompleted);
		});

		const total = validLessons.length;
		const completed = completedLessons.length;
		const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

		return { completed, total, percentage };
	}, [chapter?.lessons, isEnrolledStatus]);

	const handleToggleExpanded = () => {
		setIsExpanded(!isExpanded);
	};

	// Expose functions to parent component
	useImperativeHandle(ref, () => ({
		toggleExpanded: handleToggleExpanded,
		setExpanded: (expanded: boolean) => {
			setIsExpanded(expanded);
		},
	}));

	const validLessons = chapter?.lessons?.filter((lesson) => lesson !== null) || [];

	return (
		<Box
			sx={{
				'marginBottom': isMobileSize ? '1rem' : '1.5rem',
				'backgroundColor': '#ffffff',
				'border': '1px solid #e2e8f0',
				'borderRadius': '0.35rem',
				'overflow': 'hidden',
				'boxShadow': '0 1px 3px rgba(0, 0, 0, 0.1)',
				'transition': 'box-shadow 0.3s ease',
				'&:hover': {
					boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
					borderColor: '#cbd5e1',
				},
			}}>
			{/* Chapter Header - Always Visible */}
			<Box
				sx={{
					'backgroundColor': theme.bgColor?.primary,
					'padding': isMobileSize ? '0.5rem 1rem' : '0.75rem 1rem 0.75rem 0.25rem',
					'cursor': 'pointer',
					'display': 'flex',
					'alignItems': 'center',
					'justifyContent': 'space-between',
					'transition': 'background-color 0.2s ease',
					'&:hover': {
						backgroundColor: theme.bgColor?.primary,
					},
				}}
				onClick={handleToggleExpanded}
				role='button'
				tabIndex={0}
				onKeyDown={(e) => {
					if (e.key === 'Enter' || e.key === ' ') {
						e.preventDefault();
						handleToggleExpanded();
					}
				}}
				aria-expanded={isExpanded}
				aria-label={`${isExpanded ? 'Collapse' : 'Expand'} chapter: ${chapter.title}`}>
				<Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
					<IconButton
						sx={{
							color: 'white',
							marginRight: isMobileSize ? '0.5rem' : '1rem',
							padding: isMobileSize ? '0.25rem' : '0.5rem',
							transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
							transition: 'transform 0.3s ease',
						}}
						aria-hidden='true'>
						<ExpandMore />
					</IconButton>
					<Typography
						variant='h4'
						sx={{
							fontSize: isMobileSize ? '0.8rem' : '0.95rem',
							color: 'white',
							flex: 1,
							textShadow: '0 1px 3px rgba(0, 0, 0, 0.3)',
						}}>
						{chapter.title}
					</Typography>
				</Box>

				{/* Progress Indicators */}
				<Box sx={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
					{isEnrolledStatus && progressData.total > 0 && (
						<>
							<Chip
								icon={<PlayCircleOutline />}
								label={`${progressData.completed}/${progressData.total}`}
								size='small'
								sx={{
									'backgroundColor': 'rgba(255, 255, 255, 0.25)',
									'color': 'white',
									'fontSize': isMobileSize ? '0.7rem' : '0.8rem',
									'fontWeight': 600,
									'height': isMobileSize ? '1.5rem' : '1.8rem',
									'textShadow': '0 1px 2px rgba(0, 0, 0, 0.3)',
									'& .MuiChip-icon': {
										color: 'white',
										fontSize: isMobileSize ? '0.8rem' : '1rem',
									},
								}}
							/>
							<Box
								sx={{
									width: isMobileSize ? '40px' : '50px',
									height: isMobileSize ? '6px' : '8px',
									backgroundColor: 'rgba(255, 255, 255, 0.3)',
									borderRadius: '4px',
									overflow: 'hidden',
								}}>
								<Box
									sx={{
										width: `${progressData.percentage}%`,
										height: '100%',
										backgroundColor: progressData.percentage === 100 ? '#4caf50' : '#ff9800',
										transition: 'width 0.3s ease',
									}}
								/>
							</Box>
						</>
					)}
				</Box>
			</Box>

			{/* Collapsible Content */}
			<Collapse in={isExpanded} timeout='auto' unmountOnExit>
				<Box sx={{ boxShadow: '0.1rem 0 0.3rem 0.2rem rgba(0, 0, 0, 0.2)' }}>
					{validLessons.map((lesson: LessonById, index) => {
						let nextLessonId: string = '';
						if (index !== validLessons.length - 1) {
							nextLessonId = validLessons[index + 1]._id;
						}
						let lessonOrder: number = index + 1;
						return (
							<Lesson
								key={lesson._id}
								lesson={lesson}
								isEnrolledStatus={isEnrolledStatus}
								nextLessonId={nextLessonId}
								nextChapterFirstLessonId={nextChapterFirstLessonId}
								lessonOrder={lessonOrder}
							/>
						);
					})}
				</Box>
			</Collapse>
		</Box>
	);
});

Chapter.displayName = 'Chapter';

export default Chapter;
