import { Avatar, Box, CircularProgress, Alert, Button, Paper, Typography } from '@mui/material';
import DashboardPagesLayout from '../components/layouts/dashboardLayout/DashboardPagesLayout';
import AdminPageErrorBoundary from '../components/error/AdminPageErrorBoundary';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useUserAssessmentSummary } from '../hooks/useUserAssessmentSummary';
import { useUserCourseAnalytics } from '../hooks/useUserCourseAnalytics';
import { useUserCourseRank } from '../hooks/useUserCourseRank';
import { useCourseLeaderboard } from '../hooks/useCourseLeaderboard';
import { useCourseCertificate } from '../hooks/useCourseCertificate';
import { useCourseCompletion } from '../hooks/useCourseCompletion';
import theme from '../themes';
import { KeyboardBackspaceOutlined, Download, CheckCircle } from '@mui/icons-material';
import { useContext } from 'react';
import { MediaQueryContext } from '../contexts/MediaQueryContextProvider';
import CustomSubmitButton from '../components/forms/customButtons/CustomSubmitButton';

const CourseAnalytics = () => {
	const { courseId, userCourseId } = useParams<{ courseId: string; userCourseId: string }>();
	const { user } = useAuth();
	const navigate = useNavigate();
	const { isSmallScreen, isRotatedMedium } = useContext(MediaQueryContext);
	const isMobileSize = isSmallScreen || isRotatedMedium;

	const assessmentGroupId = courseId;

	const { data, isLoading, error } = useUserAssessmentSummary(user?._id, assessmentGroupId);
	const { data: courseAnalytics, isLoading: isCourseAnalyticsLoading, error: courseAnalyticsError } = useUserCourseAnalytics(courseId);
	const { data: rankAnalytics, isLoading: isRankLoading, error: rankError } = useUserCourseRank(courseId);
	const { data: leaderboardData, isLoading: isLeaderboardLoading, error: leaderboardError } = useCourseLeaderboard(courseId);
	const { isCompleted } = useCourseCompletion(courseId, userCourseId);
	const { downloadCertificate, isDownloading, error: certificateError } = useCourseCertificate(courseId);

	const pre = data?.pre || null;
	const post = data?.post || null;

	const hasAnyData = Boolean(pre || post);

	const prePercent = pre?.scorePercent ?? null;
	const postPercent = post?.scorePercent ?? null;

	const improvement = prePercent !== null && postPercent !== null ? Math.round((postPercent as number) - (prePercent as number)) : null;

	const formatScore = (attempt: typeof pre) => {
		if (!attempt) return 'N/A';
		if (attempt.scoreRaw === null || attempt.scoreMax === null) return 'N/A';
		return `${attempt.scoreRaw}/${attempt.scoreMax}`;
	};

	const formatPercent = (value: number | null) => {
		if (value === null || Number.isNaN(value)) return 'N/A';
		return `${value}%`;
	};

	const renderBar = (label: string, percent: number | null, color: string) => {
		const safePercent = percent !== null && percent >= 0 ? Math.min(percent, 100) : 0;
		const height = safePercent === 0 ? 4 : safePercent * 1.2; // px height, minimal bar if 0

		return (
			<Box
				sx={{
					display: 'flex',
					flexDirection: 'column',
					alignItems: 'center',
					flex: 1,
					minWidth: 80,
				}}>
				<Box
					sx={{
						display: 'flex',
						alignItems: 'flex-end',
						justifyContent: 'center',
						height: 150,
						width: '60%',
					}}>
					<Box
						sx={{
							width: '100%',
							height,
							borderRadius: '0.5rem',
							background: `linear-gradient(135deg, ${color} 0%, ${color}CC 100%)`,
							boxShadow: '0 4px 12px rgba(15, 23, 42, 0.25)',
							transition: 'height 0.4s ease',
						}}
					/>
				</Box>
				<Typography variant='body2' sx={{ mt: 1, fontWeight: 600 }}>
					{label}
				</Typography>
				<Typography variant='caption' sx={{ color: theme.textColor?.secondary?.main || 'text.secondary' }}>
					{formatPercent(percent)}
				</Typography>
			</Box>
		);
	};

	return (
		<AdminPageErrorBoundary>
			<DashboardPagesLayout pageName='Course Analytics' customSettings={{ justifyContent: 'flex-start' }} showCopyRight={true}>
				<Box sx={{ width: '100%', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: 3 }}>
					{!isLoading && error && <Alert severity='error'>{error.message || 'Failed to load assessment analytics. Please try again later.'}</Alert>}

					{!isCourseAnalyticsLoading && courseAnalyticsError && (
						<Alert severity='error'>{courseAnalyticsError.message || 'Failed to load course analytics. Please try again later.'}</Alert>
					)}

					{!isRankLoading && rankError && <Alert severity='error'>{rankError.message || 'Failed to load ranking information.'}</Alert>}

					{!isLeaderboardLoading && leaderboardError && (
						<Alert severity='error'>{leaderboardError.message || 'Failed to load leaderboard information.'}</Alert>
					)}

					{/* Back to course button */}
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
								if (!courseId || !userCourseId) return;
								navigate(`/course/${courseId}/userCourseId/${userCourseId}`);
							}}>
							Back to course
						</Button>
					</Box>

					{/* Course Completion Certificate Section */}
					{isCompleted && (
						<Paper
							elevation={4}
							sx={{
								p: 3,
								borderRadius: 3,
								backgroundColor: theme.bgColor?.secondary,
								boxShadow: '0 14px 32px rgba(15, 23, 42, 0.3)',
								border: '2px solid rgba(34, 197, 94, 0.3)',
								background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.05) 0%, rgba(16, 185, 129, 0.05) 100%)',
								margin: '0 auto',
								mb: '3rem',
								width: '80%',
							}}>
							<Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
								<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
									<CheckCircle sx={{ color: '#22c55e', fontSize: isMobileSize ? '2rem' : '2.5rem' }} />
									<Typography variant='h5' sx={{ fontWeight: 700, color: theme.textColor?.primary.main }}>
										Course Completed! 🎉
									</Typography>
								</Box>
								<Typography variant='body1' sx={{ color: theme.textColor?.secondary?.main || 'text.secondary', textAlign: 'center' }}>
									Congratulations! You have successfully completed this course.
								</Typography>
								<CustomSubmitButton
									startIcon={isDownloading ? <CircularProgress size={20} color='inherit' /> : <Download />}
									onClick={downloadCertificate}
									disabled={isDownloading}
									sx={{
										textTransform: 'capitalize',
										mt: 1,
										px: 4,
										py: 2,
										fontSize: isMobileSize ? '0.9rem' : '1rem',
									}}>
									{isDownloading ? 'Generating Certificate...' : isMobileSize ? 'Certificate' : 'Download Certificate'}
								</CustomSubmitButton>
								{certificateError && (
									<Alert severity='error' sx={{ mt: 1, width: '100%', maxWidth: 500 }}>
										{certificateError}
									</Alert>
								)}
							</Box>
						</Paper>
					)}

					{!isLoading && !error && hasAnyData && (
						<>
							<Box
								sx={{
									display: 'flex',
									gap: 2,
									flexWrap: 'wrap',
									justifyContent: 'center',
								}}>
								<Paper
									elevation={4}
									sx={{
										flex: '1 1 260px',
										minWidth: 260,
										maxWidth: 360,
										p: 2.5,
										borderRadius: 3,
										backgroundColor: theme.bgColor?.secondary,
										boxShadow: '0 10px 24px rgba(15, 23, 42, 0.25)',
										border: '1px solid rgba(148, 163, 184, 0.35)',
										display: 'flex',
										flexDirection: 'column',
										justifyContent: 'space-between',
										textAlign: isMobileSize ? 'center' : 'left',
									}}>
									<Typography variant='body1' sx={{ mb: 1, fontWeight: 600 }}>
										Pre-assessment
									</Typography>
									<Typography variant='h5' sx={{ fontWeight: 700, margin: '1rem 0' }}>
										{formatPercent(prePercent)}
									</Typography>
									<Typography variant='body2' sx={{ color: theme.textColor?.secondary?.main || 'text.secondary' }}>
										Score: {formatScore(pre)}
									</Typography>
								</Paper>

								<Paper
									elevation={4}
									sx={{
										flex: '1 1 260px',
										minWidth: 260,
										maxWidth: 360,
										p: 2.5,
										borderRadius: 3,
										backgroundColor: theme.bgColor?.secondary,
										boxShadow: '0 10px 24px rgba(15, 23, 42, 0.25)',
										border: '1px solid rgba(148, 163, 184, 0.35)',
										display: 'flex',
										flexDirection: 'column',
										justifyContent: 'space-between',
										textAlign: isMobileSize ? 'center' : 'left',
									}}>
									<Typography variant='body1' sx={{ mb: 1, fontWeight: 600 }}>
										Post-assessment
									</Typography>
									<Typography variant='h5' sx={{ fontWeight: 700, margin: '1rem 0' }}>
										{formatPercent(postPercent)}
									</Typography>
									<Typography variant='body2' sx={{ color: theme.textColor?.secondary?.main || 'text.secondary' }}>
										Score: {formatScore(post)}
									</Typography>
								</Paper>

								<Paper
									elevation={4}
									sx={{
										flex: '1 1 260px',
										minWidth: 260,
										maxWidth: 360,
										p: 2.5,
										borderRadius: 3,
										backgroundColor: theme.bgColor?.secondary,
										boxShadow: '0 10px 24px rgba(15, 23, 42, 0.25)',
										border: '1px solid rgba(148, 163, 184, 0.35)',
										display: 'flex',
										flexDirection: 'column',
										justifyContent: 'space-between',
										textAlign: isMobileSize ? 'center' : 'left',
									}}>
									<Typography variant='body1' sx={{ mb: 1, fontWeight: 600 }}>
										Improvement
									</Typography>
									<Typography variant='h5' sx={{ fontWeight: 700, margin: '1rem 0' }}>
										{improvement !== null ? `${improvement > 0 ? '+' : ''}${improvement} %` : 'N/A'}
									</Typography>
									<Typography variant='body2' sx={{ color: theme.textColor?.secondary?.main || 'text.secondary' }}>
										Difference between post and pre scores
									</Typography>
								</Paper>
							</Box>

							{/* Simple bar comparison */}
							<Paper
								elevation={4}
								sx={{
									p: 3,
									borderRadius: 2,
									backgroundColor: theme.bgColor?.secondary,
									width: '80%',
									margin: '0 auto 4rem auto',
									mt: 2,
								}}>
								<Typography variant='body1' sx={{ mb: 2 }}>
									Pre vs Post Assessment
								</Typography>
								<Box sx={{ display: 'flex', gap: 4, justifyContent: 'center', alignItems: 'flex-end' }}>
									{renderBar('Pre', prePercent, '#0ea5e9')}
									{renderBar('Post', postPercent, '#22c55e')}
								</Box>
							</Paper>

							{/* 2) Course total score + percentage + rank cards (3 cards) come after pre/post when available */}
							{!isCourseAnalyticsLoading && !courseAnalyticsError && courseAnalytics && rankAnalytics && (
								<Box
									sx={{
										display: 'flex',
										gap: 2.5,
										flexWrap: 'wrap',
										mt: '1rem',
										justifyContent: 'center',
									}}>
									<Paper
										elevation={4}
										sx={{
											flex: '1 1 280px',
											minWidth: 280,
											maxWidth: 360,
											p: 2.75,
											borderRadius: 3,
											backgroundColor: theme.bgColor?.secondary,
											boxShadow: '0 14px 32px rgba(15, 23, 42, 0.3)',
											border: '1px solid rgba(148, 163, 184, 0.4)',
											textAlign: isMobileSize ? 'center' : 'left',
										}}>
										<Typography variant='body1' sx={{ mb: 1.25, fontSize: '1rem' }}>
											Your Total Course Score
										</Typography>
										<Typography variant='h4' sx={{ fontWeight: 700, margin: '1rem 0' }}>
											{courseAnalytics.totalEarnedScore} / {courseAnalytics.totalPossibleScore}
										</Typography>
										<Typography variant='body2' sx={{ color: theme.textColor?.secondary?.main || 'text.secondary' }}>
											Overall progress in graded quizzes
										</Typography>
									</Paper>

									<Paper
										elevation={4}
										sx={{
											flex: '1 1 280px',
											minWidth: 280,
											maxWidth: 360,
											p: 2.75,
											borderRadius: 3,
											backgroundColor: theme.bgColor?.secondary,
											boxShadow: '0 14px 32px rgba(15, 23, 42, 0.3)',
											border: '1px solid rgba(148, 163, 184, 0.4)',
											textAlign: isMobileSize ? 'center' : 'left',
										}}>
										<Typography variant='body1' sx={{ mb: 1.25, fontSize: '1rem' }}>
											Overall Percentage
										</Typography>
										<Typography variant='h4' sx={{ fontWeight: 700, margin: '1rem 0' }}>
											{courseAnalytics.percent !== null ? `${courseAnalytics.percent}%` : 'N/A'}
										</Typography>
										<Typography variant='body2' sx={{ color: theme.textColor?.secondary?.main || 'text.secondary' }}>
											Based on all graded quizzes in this course
										</Typography>
									</Paper>

									<Paper
										elevation={4}
										sx={{
											flex: '1 1 280px',
											minWidth: 280,
											maxWidth: 360,
											p: 2.75,
											borderRadius: 3,
											backgroundColor: theme.bgColor?.secondary,
											boxShadow: '0 14px 32px rgba(15, 23, 42, 0.3)',
											border: '1px solid rgba(148, 163, 184, 0.4)',
											textAlign: isMobileSize ? 'center' : 'left',
										}}>
										<Typography variant='body1' sx={{ mb: 1.25, fontSize: '1rem' }}>
											Your Rank
										</Typography>
										<Typography variant='h4' sx={{ fontWeight: 700, margin: '1rem 0' }}>
											{rankAnalytics.rank !== null ? `#${rankAnalytics.rank} of ${rankAnalytics.totalStudents}` : 'N/A'}
										</Typography>
										<Typography variant='body2' sx={{ color: theme.textColor?.secondary?.main || 'text.secondary' }}>
											Among all enrolled learners in this course
										</Typography>
									</Paper>
								</Box>
							)}
						</>
					)}

					{/* 3) If there is no pre/post data yet, still show total course score (if any) */}
					{!isLoading && !error && !hasAnyData && (
						<>
							{!isCourseAnalyticsLoading && !courseAnalyticsError && courseAnalytics && rankAnalytics && (
								<Box
									sx={{
										display: 'flex',
										gap: 2.5,
										flexWrap: 'wrap',
										mt: 1,
										justifyContent: 'center',
									}}>
									<Paper
										elevation={4}
										sx={{
											flex: '1 1 280px',
											minWidth: 280,
											maxWidth: 360,
											p: isMobileSize ? '1.5rem 1.25rem' : '2.5rem 2rem',
											borderRadius: 3,
											backgroundColor: theme.bgColor?.secondary,
											boxShadow: '0 12px 28px rgba(15, 23, 42, 0.3)',
											border: '1px solid rgba(148, 163, 184, 0.35)',
										}}>
										<Typography variant='body1' sx={{ mb: 1, textAlign: 'center', fontSize: isMobileSize ? '1.1rem' : '1.25rem' }}>
											Your Total Course Score
										</Typography>
										<Typography variant='h3' sx={{ fontWeight: 600, textAlign: 'center', mt: '2rem' }}>
											{courseAnalytics.totalEarnedScore} / {courseAnalytics.totalPossibleScore}
										</Typography>
										<Typography variant='body2' sx={{ color: theme.textColor?.secondary?.main || 'text.secondary', textAlign: 'center', mt: '2rem' }}>
											Overall progress in graded quizzes
										</Typography>
									</Paper>
									<Paper
										elevation={4}
										sx={{
											flex: '1 1 280px',
											minWidth: 280,
											maxWidth: 360,
											p: isMobileSize ? '1.5rem 1.25rem' : '2.5rem 2rem',
											borderRadius: 3,
											backgroundColor: theme.bgColor?.secondary,
											boxShadow: '0 12px 28px rgba(15, 23, 42, 0.3)',
											border: '1px solid rgba(148, 163, 184, 0.35)',
										}}>
										<Typography variant='body1' sx={{ mb: 1, textAlign: 'center', fontSize: isMobileSize ? '1.1rem' : '1.25rem' }}>
											Overall Percentage
										</Typography>
										<Typography variant='h3' sx={{ fontWeight: 600, textAlign: 'center', mt: '2rem' }}>
											{courseAnalytics.percent !== null ? `${courseAnalytics.percent}%` : 'N/A'}
										</Typography>
										<Typography variant='body2' sx={{ color: theme.textColor?.secondary?.main || 'text.secondary', textAlign: 'center', mt: '2rem' }}>
											Based on all graded quizzes in this course
										</Typography>
									</Paper>

									<Paper
										elevation={4}
										sx={{
											flex: '1 1 280px',
											minWidth: 280,
											maxWidth: 360,
											p: isMobileSize ? '1.5rem 1.25rem' : '2.5rem 2rem',
											borderRadius: 3,
											backgroundColor: theme.bgColor?.secondary,
											boxShadow: '0 12px 28px rgba(15, 23, 42, 0.3)',
											border: '1px solid rgba(148, 163, 184, 0.35)',
										}}>
										<Typography variant='body1' sx={{ mb: 1, textAlign: 'center', fontSize: isMobileSize ? '1.1rem' : '1.25rem' }}>
											Your Rank
										</Typography>
										<Typography variant='h3' sx={{ fontWeight: 600, textAlign: 'center', mt: '2rem' }}>
											{rankAnalytics.rank !== null ? `#${rankAnalytics.rank} of ${rankAnalytics.totalStudents}` : 'N/A'}
										</Typography>
										<Typography variant='body2' sx={{ color: theme.textColor?.secondary?.main || 'text.secondary', textAlign: 'center', mt: '2rem' }}>
											Among all enrolled learners in this course
										</Typography>
									</Paper>
								</Box>
							)}
						</>
					)}

					{!isLeaderboardLoading && !leaderboardError && leaderboardData && leaderboardData.leaderboard.length > 0 && (
						<Box sx={{ width: isMobileSize ? '100%' : '60%', margin: isMobileSize ? '2rem auto 4rem auto' : '3rem auto 4rem auto' }}>
							<Typography
								variant='body1'
								sx={{
									fontWeight: 600,
									mb: 2,
									fontSize: isMobileSize ? '1rem' : '1.1rem',
									textAlign: 'center',
								}}>
								Top 3 Scorers in this Course
							</Typography>

							<Paper
								elevation={3}
								sx={{
									borderRadius: 3,
									backgroundColor: theme.bgColor?.secondary,
									overflow: 'hidden',
								}}>
								{leaderboardData.leaderboard.slice(0, 3).map((item, index) => {
									const isMe = item.isCurrentUser;
									const isTop3 = item.rank <= 3;

									return (
										<Box
											key={item.userId}
											sx={{
												display: 'flex',
												alignItems: 'center',
												justifyContent: 'space-between',
												px: isMe ? 2.5 : 2,
												py: isMe ? 1.75 : 1.25,
												borderBottom: index === leaderboardData.leaderboard.slice(0, 3).length - 1 ? 'none' : '1px solid rgba(148, 163, 184, 0.25)',
												backgroundColor: isMe ? 'rgba(34, 197, 94, 0.10)' : 'transparent',
												boxShadow: isMe ? '0 10px 24px rgba(22, 163, 74, 0.25)' : 'none',
											}}>
											<Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
												<Typography
													variant='body2'
													sx={{
														minWidth: 32,
														fontWeight: isMe || isTop3 ? 700 : 500,
														color: isTop3 ? theme.textColor?.primary.main : theme.textColor?.secondary?.main,
														border: '2px solid rgba(148, 163, 184, 0.5)',
														borderRadius: '0.5rem',
														padding: '0.25rem 0.5rem',
														textAlign: 'center',
													}}>
													{item.rank}
												</Typography>

												<Avatar
													src={item.imageUrl || undefined}
													sx={{
														width: isMe ? 42 : 36,
														height: isMe ? 42 : 36,
														bgcolor: theme.bgColor?.primary,
														fontSize: isMe ? '0.95rem' : '0.85rem',
													}}>
													{!item.imageUrl && item.name ? item.name.charAt(0).toUpperCase() : ''}
												</Avatar>

												<Box sx={{ display: 'flex', flexDirection: 'column' }}>
													<Typography
														variant='body2'
														sx={{
															fontWeight: isMe ? 700 : 500,
															fontSize: isMe ? (isMobileSize ? '0.9rem' : '1rem') : isMobileSize ? '0.8rem' : '0.9rem',
														}}>
														{item.name}
														{isMe && ' (You)'}
													</Typography>
												</Box>
											</Box>

											<Box>
												<Typography variant={isMobileSize ? 'body2' : 'body1'} sx={{ color: theme.textColor?.secondary?.main || 'text.secondary' }}>
													{item.totalEarnedScore} / {leaderboardData.totalPossibleScore}
												</Typography>
											</Box>

											<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
												<Typography
													variant={isMobileSize ? 'body2' : 'body1'}
													sx={{
														fontWeight: 600,
														color: isTop3 ? theme.textColor?.primary.main : theme.textColor?.secondary?.main,
													}}>
													{item.percent !== null ? `${item.percent}%` : 'N/A'}
												</Typography>
											</Box>
										</Box>
									);
								})}
							</Paper>
						</Box>
					)}
				</Box>
			</DashboardPagesLayout>
		</AdminPageErrorBoundary>
	);
};

export default CourseAnalytics;
