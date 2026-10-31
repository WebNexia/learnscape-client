import {
	Avatar,
	Box,
	CircularProgress,
	IconButton,
	Paper,
	Popper,
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
	DialogContent,
	Accordion,
	AccordionSummary,
	AccordionDetails,
} from '@mui/material';
import DashboardPagesLayout from '../components/layouts/dashboardLayout/DashboardPagesLayout';
import AdminPageErrorBoundary from '../components/error/AdminPageErrorBoundary';
import { useNavigate, useParams } from 'react-router-dom';
import { useCourseStudentsAnalytics } from '../hooks/useCourseStudentsAnalytics';
import theme from '../themes';
import { KeyboardBackspaceOutlined } from '@mui/icons-material';
import DownloadIcon from '@mui/icons-material/Download';
import PictureAsPdfOutlinedIcon from '@mui/icons-material/PictureAsPdfOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CustomDialog from '../components/layouts/dialog/CustomDialog';
import CustomDialogActions from '../components/layouts/dialog/CustomDialogActions';
import { assessmentService, StudentCompletedProgress } from '../services/assessmentService';
import { useAuth } from '../hooks/useAuth';
import { ReactNode, useContext, useEffect, useMemo, useRef, useState } from 'react';
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

const CHAPTER_HEADER_COLORS = ['#009694', '#01435A', '#1B6CA8', '#0F766E', '#C45C26'];

type ReportHoverActionsProps = {
	onPreview: () => void;
	onDownload: () => void;
	downloadBusy?: boolean;
	children: ReactNode;
};

const fetchPdfBlob = async (path: string) => {
	const response = await axiosInstance.get(path, { responseType: 'blob' });
	return new Blob([response.data], { type: 'application/pdf' });
};

const savePdf = (blob: Blob, filename: string) => {
	const url = window.URL.createObjectURL(blob);
	const link = document.createElement('a');
	link.href = url;
	link.setAttribute('download', filename);
	document.body.appendChild(link);
	link.click();
	link.remove();
	window.URL.revokeObjectURL(url);
};

/** Hover (or tap, when the device has no hover) reveals Preview and Download. */
const ReportHoverActions = ({ onPreview, onDownload, downloadBusy = false, children }: ReportHoverActionsProps) => {
	const anchorRef = useRef<HTMLDivElement>(null);
	const menuRef = useRef<HTMLDivElement>(null);
	const hideTimer = useRef<number>();
	const [open, setOpen] = useState(false);

	const show = () => {
		window.clearTimeout(hideTimer.current);
		setOpen(true);
	};

	const hideSoon = () => {
		window.clearTimeout(hideTimer.current);
		hideTimer.current = window.setTimeout(() => setOpen(false), 180);
	};

	useEffect(() => {
		return () => window.clearTimeout(hideTimer.current);
	}, []);

	useEffect(() => {
		if (!open) return;
		const onPointerDown = (event: PointerEvent) => {
			const target = event.target as Node | null;
			if (!target) return;
			if (anchorRef.current?.contains(target) || menuRef.current?.contains(target)) return;
			setOpen(false);
		};
		document.addEventListener('pointerdown', onPointerDown);
		return () => document.removeEventListener('pointerdown', onPointerDown);
	}, [open]);

	const run = (action: () => void) => {
		setOpen(false);
		action();
	};

	const staysOpen = (next: EventTarget | null) => {
		if (!(next instanceof Node)) return false;
		return Boolean(anchorRef.current?.contains(next) || menuRef.current?.contains(next));
	};

	return (
		<>
			<Box
				ref={anchorRef}
				onMouseEnter={show}
				onMouseLeave={hideSoon}
				onFocus={show}
				onBlur={(event) => {
					if (staysOpen(event.relatedTarget)) return;
					hideSoon();
				}}
				onClick={() => {
					if (window.matchMedia('(hover: none)').matches) setOpen((value) => !value);
				}}
				sx={{ display: 'inline-flex' }}>
				{children}
			</Box>
			<Popper
				open={open}
				anchorEl={anchorRef.current}
				placement='top'
				modifiers={[{ name: 'offset', options: { offset: [0, 8] } }]}
				sx={{ zIndex: 1200 }}>
				<Box
					ref={menuRef}
					onMouseEnter={show}
					onMouseLeave={hideSoon}
					sx={{
						display: 'flex',
						flexDirection: 'column',
						alignItems: 'stretch',
						gap: 0.5,
						p: 0.5,
						minWidth: 132,
						borderRadius: '12px',
						backgroundColor: '#fff',
						border: '1px solid #E2E8F0',
						boxShadow: '0 8px 24px rgba(1, 67, 90, 0.18)',
					}}>
					<Button
						size='small'
						variant='contained'
						startIcon={<VisibilityOutlinedIcon sx={{ fontSize: 16 }} />}
						onClick={() => run(onPreview)}
						sx={{
							textTransform: 'none',
							fontFamily: theme.fontFamily?.main,
							backgroundColor: '#009694',
							color: '#fff',
							borderRadius: '8px',
							px: 1.25,
							justifyContent: 'flex-start',
							fontSize: '0.8rem',
							boxShadow: 'none',
							'&:hover': { backgroundColor: '#007E7C', boxShadow: 'none' },
						}}>
						Preview
					</Button>
					<Button
						size='small'
						variant='contained'
						disabled={downloadBusy}
						startIcon={downloadBusy ? <CircularProgress size={14} color='inherit' /> : <DownloadIcon sx={{ fontSize: 16 }} />}
						onClick={() => run(onDownload)}
						sx={{
							textTransform: 'none',
							fontFamily: theme.fontFamily?.main,
							backgroundColor: '#C45C26',
							color: '#fff',
							borderRadius: '8px',
							px: 1.25,
							justifyContent: 'flex-start',
							fontSize: '0.8rem',
							boxShadow: 'none',
							'&:hover': { backgroundColor: '#A34A1C', boxShadow: 'none' },
							'&.Mui-disabled': { backgroundColor: '#E8C3B0', color: '#fff' },
						}}>
						Download
					</Button>
				</Box>
			</Popper>
		</>
	);
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
	const [reportPreview, setReportPreview] = useState<{ title: string; url: string; loading: boolean; error: string } | null>(null);
	const previewUrlRef = useRef('');
	const previewRequestRef = useRef(0);
	const [sortKey, setSortKey] = useState<StudentSortKey>('rank');
	const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
	const [progressStudentName, setProgressStudentName] = useState('');
	const [downloadingStudentId, setDownloadingStudentId] = useState('');
	const [progressOpen, setProgressOpen] = useState(false);
	const [progressLoading, setProgressLoading] = useState(false);
	const [progressError, setProgressError] = useState('');
	const [progress, setProgress] = useState<StudentCompletedProgress | null>(null);

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
	const todayStamp = () => new Date().toISOString().split('T')[0];

	const classReportFile = () => {
		const titleSlug = courseReportFilenameSlug(data?.title);
		return {
			path: `${base_url}/courses/${courseId}/analytics/students/export-pdf`,
			filename: `${titleSlug}_Class_Report_${todayStamp()}.pdf`,
			title: 'Class Report',
		};
	};

	const learnerReportFile = (userId: string, name: string) => {
		const titleSlug = courseReportFilenameSlug(data?.title);
		const nameSlug = courseReportFilenameSlug(name);
		return {
			path: `${base_url}/courses/${courseId}/analytics/students/${userId}/export-pdf`,
			filename: `${titleSlug}_${nameSlug}_Report_${todayStamp()}.pdf`,
			title: `Learner Report · ${name}`,
		};
	};

	const closeReportPreview = () => {
		previewRequestRef.current += 1;
		if (previewUrlRef.current) {
			window.URL.revokeObjectURL(previewUrlRef.current);
			previewUrlRef.current = '';
		}
		setReportPreview(null);
	};

	useEffect(() => {
		return () => {
			if (previewUrlRef.current) window.URL.revokeObjectURL(previewUrlRef.current);
		};
	}, []);

	const openReportPreview = async (path: string, title: string) => {
		const requestId = ++previewRequestRef.current;
		if (previewUrlRef.current) {
			window.URL.revokeObjectURL(previewUrlRef.current);
			previewUrlRef.current = '';
		}
		setReportPreview({ title, url: '', loading: true, error: '' });
		try {
			const blob = await fetchPdfBlob(path);
			if (requestId !== previewRequestRef.current) return;
			const url = window.URL.createObjectURL(blob);
			previewUrlRef.current = url;
			setReportPreview({ title, url, loading: false, error: '' });
		} catch (err) {
			if (requestId !== previewRequestRef.current) return;
			// eslint-disable-next-line no-console
			console.error('Failed to preview report:', err);
			setReportPreview({ title, url: '', loading: false, error: 'Could not load this report.' });
		}
	};

	const openStudentProgress = async (userId: string, name: string) => {
		if (!courseId) return;
		setProgressStudentName(name);
		setProgress(null);
		setProgressError('');
		setProgressOpen(true);
		setProgressLoading(true);
		try {
			const detail = await assessmentService.getStudentCompletedProgress(courseId, userId);
			setProgress(detail);
		} catch (err) {
			// eslint-disable-next-line no-console
			console.error('Failed to load completed chapters:', err);
			setProgressError('Could not load this learner’s chapters.');
		} finally {
			setProgressLoading(false);
		}
	};

	const closeStudentProgress = () => {
		setProgressOpen(false);
	};

	const handleDownloadStudentReport = async (userId: string, name: string) => {
		if (!courseId || !userId || downloadingStudentId) return;

		try {
			setDownloadingStudentId(userId);
			const report = learnerReportFile(userId, name);
			const blob = await fetchPdfBlob(report.path);
			savePdf(blob, report.filename);
		} catch (err) {
			// eslint-disable-next-line no-console
			console.error('Failed to download learner report:', err);
		} finally {
			setDownloadingStudentId('');
		}
	};

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
		if (!courseId || isDownloadingPdf) return;

		try {
			setIsDownloadingPdf(true);
			const report = classReportFile();
			const blob = await fetchPdfBlob(report.path);
			savePdf(blob, report.filename);
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
									<ReportHoverActions
										onPreview={() => {
											const report = classReportFile();
											void openReportPreview(report.path, report.title);
										}}
										onDownload={() => void handleDownloadClassReport()}
										downloadBusy={isDownloadingPdf}>
										<Button
											variant='contained'
											size='small'
											startIcon={isDownloadingPdf ? <CircularProgress size={14} color='inherit' /> : <PictureAsPdfOutlinedIcon />}
											sx={{ textTransform: 'none', fontFamily: theme.fontFamily?.main, borderRadius: '999px' }}>
											{isMobileSize ? 'PDF' : 'Class report'}
										</Button>
									</ReportHoverActions>
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
											<TableCell sx={{ width: 88 }} />
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
												<TableCell sx={{ textAlign: 'center', width: 88, padding: '0.15rem', whiteSpace: 'nowrap' }}>
													<ReportHoverActions
														onPreview={() => {
															const report = learnerReportFile(student.userId, student.name);
															void openReportPreview(report.path, report.title);
														}}
														onDownload={() => void handleDownloadStudentReport(student.userId, student.name)}
														downloadBusy={downloadingStudentId === student.userId}>
														<IconButton
															size='small'
															aria-label={`Learner report for ${student.name}`}
															sx={{ color: theme.textColor?.primary.main }}>
															{downloadingStudentId === student.userId ? (
																<CircularProgress size={16} />
															) : (
																<PictureAsPdfOutlinedIcon fontSize='small' />
															)}
														</IconButton>
													</ReportHoverActions>
													<Tooltip title='Completed chapters' placement='top' arrow>
														<IconButton
															size='small'
															aria-label={`View completed chapters for ${student.name}`}
															onClick={() => openStudentProgress(student.userId, student.name)}
															sx={{ color: theme.textColor?.primary.main }}>
															<VisibilityOutlinedIcon fontSize='small' />
														</IconButton>
													</Tooltip>
												</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							</Paper>

							<CustomDialog
								openModal={Boolean(reportPreview)}
								closeModal={closeReportPreview}
								title={reportPreview?.title || 'Report'}
								maxWidth='lg'
								titleSx={{ fontFamily: theme.fontFamily?.main, pb: 1 }}
								PaperProps={{
									sx: {
										height: '92vh',
										maxHeight: '92vh',
									},
								}}>
								<DialogContent sx={{ display: 'flex', flexDirection: 'column', pt: 0, pb: 1, minHeight: 0, flex: 1 }}>
									{reportPreview?.loading && (
										<Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1, minHeight: '60vh' }}>
											<CircularProgress size={32} />
										</Box>
									)}
									{reportPreview?.error && (
										<Alert severity='error' sx={{ my: 1 }}>
											{reportPreview.error}
										</Alert>
									)}
									{reportPreview?.url && (
										<Box
											component='iframe'
											title={reportPreview.title}
											src={reportPreview.url}
											sx={{
												flex: 1,
												width: '100%',
												minHeight: isMobileSize ? '68vh' : '74vh',
												border: 0,
												borderRadius: '8px',
												backgroundColor: '#f8fafc',
											}}
										/>
									)}
								</DialogContent>
								<CustomDialogActions onCancel={closeReportPreview} cancelBtnText='Close' hideSubmit actionSx={{ margin: 'auto 1rem' }} />
							</CustomDialog>

							<CustomDialog
								openModal={progressOpen}
								closeModal={closeStudentProgress}
								title={progressStudentName}
								maxWidth='sm'
								titleSx={{ fontFamily: theme.fontFamily?.main }}>
								<DialogContent sx={{ pt: 0.5, pb: 1 }}>
									{progressLoading && (
										<Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
											<CircularProgress size={28} />
										</Box>
									)}
									{progressError && (
										<Alert severity='error' sx={{ my: 1 }}>
											{progressError}
										</Alert>
									)}
									{!progressLoading && !progressError && progress && progress.chapters.length === 0 && (
										<Typography variant='body2' sx={{ py: 2, color: 'text.secondary' }}>
											No completed lessons yet.
										</Typography>
									)}
									{!progressLoading &&
										!progressError &&
										progress?.chapters.map((chapter, chapterIndex) => {
											const headerColor = CHAPTER_HEADER_COLORS[chapterIndex % CHAPTER_HEADER_COLORS.length];
											return (
												<Accordion
													key={chapter.id}
													disableGutters
													elevation={0}
													sx={{
														borderRadius: '8px !important',
														mb: 1,
														'&:before': { display: 'none' },
														overflow: 'hidden',
													}}>
													<AccordionSummary
														expandIcon={<ExpandMoreIcon sx={{ color: '#fff' }} />}
														sx={{
															minHeight: 48,
															backgroundColor: headerColor,
															color: '#fff',
															'& .MuiAccordionSummary-content': { my: 1 },
														}}>
														<Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', pr: 1, gap: 1 }}>
															<Typography sx={{ fontWeight: 600, fontSize: isMobileSize ? '0.8rem' : '0.9rem', color: '#fff' }}>{chapter.title}</Typography>
															<Typography sx={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.75rem', flexShrink: 0 }}>
																{chapter.lessons.length}/{chapter.totalLessons ?? chapter.lessons.length}{' '}
																{(chapter.totalLessons ?? chapter.lessons.length) === 1 ? 'lesson' : 'lessons'}
															</Typography>
														</Box>
													</AccordionSummary>
													<AccordionDetails sx={{ pt: 1, px: 1.25, pb: 1.25, backgroundColor: '#F8FBFC' }}>
														{chapter.lessons.map((lesson) => {
															const isScoredQuiz = lesson.isQuiz && lesson.scoreEarned != null && lesson.scorePossible != null;
															return (
																<Box
																	key={lesson.id}
																	sx={{
																		display: 'flex',
																		alignItems: 'center',
																		justifyContent: 'space-between',
																		gap: 2,
																		py: 0.75,
																		px: 1.25,
																		mb: 0.5,
																		borderRadius: '6px',
																		backgroundColor: isScoredQuiz ? '#FFF1E8' : '#E7F6F6',
																		borderLeft: '3px solid',
																		borderLeftColor: isScoredQuiz ? '#FF6B3D' : headerColor,
																	}}>
																	<Typography sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem', color: '#01435A' }}>{lesson.title}</Typography>
																	{isScoredQuiz && (
																		<Typography
																			sx={{
																				fontSize: isMobileSize ? '0.75rem' : '0.85rem',
																				fontVariantNumeric: 'tabular-nums',
																				fontWeight: 700,
																				flexShrink: 0,
																				color: '#C45C26',
																				backgroundColor: '#fff',
																				borderRadius: '999px',
																				px: 1,
																				py: 0.25,
																			}}>
																			{lesson.scoreEarned}/{lesson.scorePossible}
																		</Typography>
																	)}
																</Box>
															);
														})}
													</AccordionDetails>
												</Accordion>
											);
										})}
								</DialogContent>
								<CustomDialogActions onCancel={closeStudentProgress} cancelBtnText='Close' hideSubmit actionSx={{ margin: 'auto 1rem' }} />
							</CustomDialog>
						</>
					)}
				</Box>
			</DashboardPagesLayout>
		</AdminPageErrorBoundary>
	);
};

export default AdminCourseAnalytics;
