import {
	Avatar,
	Box,
	CircularProgress,
	IconButton,
	Paper,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableRow,
	TableSortLabel,
	Typography,
	Alert,
	Button,
	Tooltip,
} from '@mui/material';
import DashboardPagesLayout from '../components/layouts/dashboardLayout/DashboardPagesLayout';
import AdminPageErrorBoundary from '../components/error/AdminPageErrorBoundary';
import { useNavigate, useParams } from 'react-router-dom';
import { useCourseStudentsAnalytics } from '../hooks/useCourseStudentsAnalytics';
import theme from '../themes';
import { KeyboardBackspaceOutlined } from '@mui/icons-material';
import DownloadIcon from '@mui/icons-material/Download';
import PictureAsPdfOutlinedIcon from '@mui/icons-material/PictureAsPdfOutlined';
import { useAuth } from '../hooks/useAuth';
import { useContext, useMemo, useState } from 'react';
import { MediaQueryContext } from '../contexts/MediaQueryContextProvider';
import axiosInstance from '../utils/axiosInstance';

type StudentSortKey = 'rank' | 'chapters' | 'lessons' | 'percent' | 'score';

const TURKISH_FILENAME_CHARS: Record<string, string> = {
	ç: 'c',
	Ç: 'c',
	ğ: 'g',
	Ğ: 'g',
	ı: 'i',
	İ: 'i',
	ö: 'o',
	Ö: 'o',
	ş: 's',
	Ş: 's',
	ü: 'u',
	Ü: 'u',
	â: 'a',
	Â: 'a',
	î: 'i',
	Î: 'i',
	û: 'u',
	Û: 'u',
};

/** PDF download names stay ASCII: akıcılık → akicilik. */
const courseReportFilenameSlug = (title?: string) => {
	const folded = (title || 'Course')
		.replace(/[çÇğĞıİöÖşŞüÜâÂîÎûÛ]/g, (char) => TURKISH_FILENAME_CHARS[char] || char)
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '');
	return folded.replace(/[^a-z0-9]+/gi, '_').replace(/^_+|_+$/g, '') || 'Course';
};

const AdminCourseAnalytics = () => {
	const { courseId } = useParams<{ courseId: string }>();
	const navigate = useNavigate();
	const { hasAdminAccess } = useAuth();
	const { data, isLoading, error } = useCourseStudentsAnalytics(courseId);
	const { isSmallScreen, isRotatedMedium } = useContext(MediaQueryContext);
	const isMobileSize = isSmallScreen || isRotatedMedium;
	const [isDownloading, setIsDownloading] = useState(false);
	const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
	const [sortKey, setSortKey] = useState<StudentSortKey>('rank');
	const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

	const handleSort = (key: StudentSortKey) => {
		if (sortKey === key) {
			setSortDir((dir) => (dir === 'asc' ? 'desc' : 'asc'));
			return;
		}
		setSortKey(key);
		setSortDir(key === 'rank' ? 'asc' : 'desc');
	};

	const sortedStudents = useMemo(() => {
		const students = [...(data?.students ?? [])];
		const direction = sortDir === 'asc' ? 1 : -1;
		const totalLessons = data?.totalLessons ?? 0;
		const completion = (completedLessons?: number) => (totalLessons > 0 ? (completedLessons ?? 0) / totalLessons : -1);
		students.sort((a, b) => {
			if (sortKey === 'chapters') {
				const chapterDiff = (a.completedChapters ?? 0) - (b.completedChapters ?? 0);
				if (chapterDiff !== 0) return chapterDiff * direction;
				const lessonDiff = (a.completedLessons ?? 0) - (b.completedLessons ?? 0);
				if (lessonDiff !== 0) return lessonDiff * direction;
			} else if (sortKey === 'lessons' || sortKey === 'percent') {
				const lessonDiff = completion(a.completedLessons) - completion(b.completedLessons);
				if (lessonDiff !== 0) return lessonDiff * direction;
				const scoreDiff = (a.totalEarnedScore ?? 0) - (b.totalEarnedScore ?? 0);
				if (scoreDiff !== 0) return scoreDiff * direction;
			} else if (sortKey === 'score') {
				const scoreDiff = (a.totalEarnedScore ?? 0) - (b.totalEarnedScore ?? 0);
				if (scoreDiff !== 0) return scoreDiff * direction;
				const lessonDiff = completion(a.completedLessons) - completion(b.completedLessons);
				if (lessonDiff !== 0) return lessonDiff * direction;
			}
			return (a.rank - b.rank) * (sortKey === 'rank' ? direction : 1);
		});
		return students;
	}, [data?.students, data?.totalLessons, sortKey, sortDir]);

	const base_url = import.meta.env.VITE_SERVER_BASE_URL;

	const handleDownloadEnrolledStudents = async () => {
		if (!courseId || !data?.students?.length) return;

		try {
			setIsDownloading(true);
			const response = await axiosInstance.get(`${base_url}/courses/${courseId}/analytics/students/export-excel`, {
				responseType: 'blob',
			});

			const blob = new Blob([response.data], {
				type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
			});
			const url = window.URL.createObjectURL(blob);
			const link = document.createElement('a');
			const titleSlug = (data.title || 'Course').replace(/[^a-z0-9]+/gi, '_') || 'Course';
			const today = new Date().toISOString().split('T')[0];
			link.href = url;
			link.setAttribute('download', `${titleSlug}_Enrolled_Students_${today}.xlsx`);
			document.body.appendChild(link);
			link.click();
			link.remove();
			window.URL.revokeObjectURL(url);
		} catch (err) {
			// eslint-disable-next-line no-console
			console.error('Failed to download enrolled students list:', err);
		} finally {
			setIsDownloading(false);
		}
	};

	const handleDownloadClassReport = async () => {
		if (!courseId) return;

		try {
			setIsDownloadingPdf(true);
			const response = await axiosInstance.get(`${base_url}/courses/${courseId}/analytics/students/export-pdf`, {
				responseType: 'blob',
			});

			const blob = new Blob([response.data], { type: 'application/pdf' });
			const url = window.URL.createObjectURL(blob);
			const link = document.createElement('a');
			const titleSlug = courseReportFilenameSlug(data?.title);
			const today = new Date().toISOString().split('T')[0];
			link.href = url;
			link.setAttribute('download', `${titleSlug}_Class_Report_${today}.pdf`);
			document.body.appendChild(link);
			link.click();
			link.remove();
			window.URL.revokeObjectURL(url);
		} catch (err) {
			// eslint-disable-next-line no-console
			console.error('Failed to download class report:', err);
		} finally {
			setIsDownloadingPdf(false);
		}
	};

	return (
		<AdminPageErrorBoundary>
			<DashboardPagesLayout pageName='Course Analytics' customSettings={{ justifyContent: 'flex-start' }} showCopyRight={true}>
				<Box sx={{ width: '100%', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: 3 }}>
					<Box>
						<Button
							variant='text'
							startIcon={<KeyboardBackspaceOutlined fontSize='small' />}
							sx={{
								'color': theme.textColor?.primary.main,
								'textTransform': 'inherit',
								'fontFamily': theme.fontFamily?.main,
								':hover': {
									backgroundColor: 'transparent',
									textDecoration: 'underline',
								},
							}}
							onClick={() => {
								if (!courseId) return;
								const basePath = hasAdminAccess ? '/admin' : '/instructor';
								navigate(`${basePath}/course-edit/course/${courseId}`);
							}}>
							Back to course
						</Button>
					</Box>

					{isLoading && (
						<Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
							<CircularProgress />
						</Box>
					)}

					{!isLoading && error && <Alert severity='error'>{error.message || 'Failed to load course analytics. Please try again later.'}</Alert>}

					{!isLoading && !error && data && (
						<>
							<Box
								sx={{
									display: 'flex',
									flexDirection: isMobileSize ? 'column' : 'row',
									gap: 2,
									flexWrap: 'wrap',
								}}>
								<Paper
									elevation={3}
									sx={{
										p: isMobileSize ? '1.5rem 1.25rem' : '2rem 1rem',
										borderRadius: 2,
										backgroundColor: theme.bgColor?.secondary,
										flex: 1,
										display: 'flex',
										flexDirection: 'column',
										justifyContent: 'center',
										alignItems: 'center',
									}}>
									<Typography variant={isMobileSize ? 'body2' : 'body1'} sx={{ mb: 0.5 }}>
										Total Possible Score
									</Typography>
									<Typography variant='h4' sx={{ margin: '0.75rem 0' }}>
										{data.totalPossibleScore}
									</Typography>
									<Typography
										variant='body2'
										sx={{
											color: theme.textColor?.secondary?.main || 'text.secondary',
											fontSize: isMobileSize ? '0.7rem' : '0.75rem',
											textAlign: 'center',
										}}>
										Based on all graded quizzes in this course
									</Typography>
								</Paper>

								<Paper
									elevation={3}
									sx={{
										p: isMobileSize ? '1.5rem 1.25rem' : '2rem 1rem',
										borderRadius: 2,
										backgroundColor: theme.bgColor?.secondary,
										flex: 1,
										display: 'flex',
										flexDirection: 'column',
										justifyContent: 'center',
										alignItems: 'center',
									}}>
									<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5, gap: 2 }}>
										<Typography variant={isMobileSize ? 'body2' : 'body1'}>Enrolled Learners</Typography>
										<Tooltip title='Download list' placement='top' arrow>
											<IconButton
												size='small'
												onClick={handleDownloadEnrolledStudents}
												disabled={isDownloading || !data.students?.length}
												aria-label='Download enrolled learners list'>
												{isDownloading ? <CircularProgress size={16} /> : <DownloadIcon fontSize='small' />}
											</IconButton>
										</Tooltip>
									</Box>
									<Typography variant='h4' sx={{ margin: '0.75rem 0' }}>
										{data.students.length}
									</Typography>
									<Typography
										variant='body2'
										sx={{
											color: theme.textColor?.secondary?.main || 'text.secondary',
											fontSize: isMobileSize ? '0.7rem' : '0.75rem',
											textAlign: 'center',
										}}>
										Number of learners enrolled in this course
									</Typography>
								</Paper>

								<Paper
									elevation={3}
									sx={{
										p: isMobileSize ? '1.5rem 1.25rem' : '2rem 1rem',
										borderRadius: 2,
										backgroundColor: theme.bgColor?.secondary,
										flex: 1,
										display: 'flex',
										flexDirection: 'column',
										justifyContent: 'center',
										alignItems: 'center',
									}}>
									<Typography variant={isMobileSize ? 'body2' : 'body1'} sx={{ mb: 0.5 }}>
										Completed Learners
									</Typography>
									<Typography variant='h4' sx={{ margin: '0.75rem 0' }}>
										{data.completedStudentsCount}
									</Typography>
									<Typography
										variant='body2'
										sx={{
											color: theme.textColor?.secondary?.main || 'text.secondary',
											fontSize: isMobileSize ? '0.7rem' : '0.75rem',
											textAlign: 'center',
										}}>
										Learners who have completed this course
									</Typography>
								</Paper>

								<Paper
									elevation={3}
									sx={{
										p: isMobileSize ? '1.5rem 1.25rem' : '2rem 1rem',
										borderRadius: 2,
										backgroundColor: theme.bgColor?.secondary,
										flex: 1,
										display: 'flex',
										flexDirection: 'column',
										alignItems: 'center',
										gap: 1.5,
									}}>
									<Typography variant={isMobileSize ? 'body2' : 'body1'} sx={{ mb: 0.5 }}>
										Instructor
									</Typography>

									<Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
										<Avatar
											src={data.instructor?.imageUrl || undefined}
											sx={{
												width: 40,
												height: 40,
												bgcolor: theme.bgColor?.primary,
											}}
										/>
										<Typography variant='body2' sx={{ textAlign: 'center', fontSize: isMobileSize ? '0.8rem' : '0.85rem' }}>
											{data.instructor?.name || 'Not assigned'}
										</Typography>
									</Box>
								</Paper>
							</Box>

							<Paper
								elevation={3}
								sx={{
									mt: 2,
									borderRadius: 2,
									overflow: 'hidden',
									mb: '3rem',
								}}>
								<Box
									sx={{
										display: 'flex',
										justifyContent: 'flex-end',
										alignItems: 'center',
										px: 2,
										py: 1.25,
										backgroundColor: theme.bgColor?.secondary,
									}}>
									<Button
										variant='contained'
										size='small'
										startIcon={isDownloadingPdf ? <CircularProgress size={14} color='inherit' /> : <PictureAsPdfOutlinedIcon />}
										onClick={handleDownloadClassReport}
										disabled={isDownloadingPdf}
										sx={{ textTransform: 'none', fontFamily: theme.fontFamily?.main, borderRadius: '999px' }}>
										{isMobileSize ? 'PDF' : 'Class report'}
									</Button>
								</Box>
								<Table>
									<TableHead sx={{ backgroundColor: theme.bgColor?.secondary }}>
										<TableRow>
											{(
												[
													['rank', 'Rank'],
													['student', 'Student'],
													['chapters', isMobileSize ? 'Ch.' : 'Chapters'],
													['lessons', isMobileSize ? 'Les.' : 'Lessons'],
													...(!isMobileSize ? [['percent', 'Percent'] as const] : []),
													['score', isMobileSize ? 'Score' : 'Total Score'],
												] as [StudentSortKey | 'student', string][]
											).map(([key, label]) => {
												const sortable = key !== 'student';
												return (
													<TableCell
														key={key}
														sortDirection={sortable && sortKey === key ? sortDir : false}
														sx={{ fontWeight: 600, textAlign: 'center' }}>
														{sortable ? (
															<TableSortLabel
																active={sortKey === key}
																direction={sortKey === key ? sortDir : 'desc'}
																onClick={() => handleSort(key)}
																sx={{
																	color: 'inherit',
																	fontWeight: 600,
																	'&.Mui-active': { color: 'inherit' },
																	'& .MuiTableSortLabel-icon': { color: 'inherit !important' },
																}}>
																{label}
															</TableSortLabel>
														) : (
															label
														)}
													</TableCell>
												);
											})}
										</TableRow>
									</TableHead>
									<TableBody sx={{ textAlign: 'center' }}>
										{sortedStudents.map((student) => (
											<TableRow key={student.userId}>
												<TableCell sx={{ textAlign: 'center', fontSize: isMobileSize ? '0.7rem' : undefined }}>{student.rank}</TableCell>
												<TableCell sx={{ textAlign: 'center', fontSize: isMobileSize ? '0.7rem' : undefined }}>{student.name}</TableCell>
												<TableCell sx={{ textAlign: 'center', fontSize: isMobileSize ? '0.7rem' : undefined }}>
													{student.completedChapters ?? 0} / {data.totalChapters ?? 0}
												</TableCell>
												<TableCell sx={{ textAlign: 'center', fontSize: isMobileSize ? '0.7rem' : undefined }}>
													{student.completedLessons ?? 0} / {data.totalLessons ?? 0}
												</TableCell>
												{!isMobileSize && (
													<TableCell sx={{ textAlign: 'center' }}>
														{(data.totalLessons ?? 0) > 0
															? `${Math.round(((student.completedLessons ?? 0) / (data.totalLessons ?? 1)) * 100)}%`
															: 'N/A'}
													</TableCell>
												)}
												<TableCell sx={{ textAlign: 'center', fontSize: isMobileSize ? '0.7rem' : undefined }}>
													{student.totalEarnedScore}/{data.totalPossibleScore}
												</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							</Paper>
						</>
					)}
				</Box>
			</DashboardPagesLayout>
		</AdminPageErrorBoundary>
	);
};

export default AdminCourseAnalytics;
