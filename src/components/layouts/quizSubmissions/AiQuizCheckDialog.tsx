import { Box, CircularProgress, Typography } from '@mui/material';
import { useContext, useEffect, useState } from 'react';
import axios from '@utils/axiosInstance';
import { useQueryClient } from 'react-query';
import { decode } from 'html-entities';
import { doc, serverTimestamp, writeBatch } from 'firebase/firestore';
import CustomDialog from '../dialog/CustomDialog';
import CustomDialogActions from '../dialog/CustomDialogActions';
import CustomTextField from '../../forms/customFields/CustomTextField';
import { QuizSubmission } from '../../../interfaces/quizSubmission';
import { QuestionType } from '../../../interfaces/enums';
import useQuestionTypes from '../../../hooks/useQuestionTypes';
import { fetchSubmissionFeedback, submissionFeedbackQueryKey } from '../../../hooks/useSubmissionFeedback';
import { sanitizeHtml } from '../../../utils/sanitizeHtml';
import { useAuth } from '../../../hooks/useAuth';
import { useDashboardSync } from '../../../utils/dashboardSync';
import { db } from '../../../firebase';
import { MediaQueryContext } from '../../../contexts/MediaQueryContextProvider';
import theme from '../../../themes';

interface WritingDraftItem {
	userQuestionId: string;
	questionHtml: string;
	questionText: string;
	studentAnswer: string;
	feedback: string;
	score: string;
	pointsPossible: number;
	previousPoints: number;
	drafting: boolean;
	error: string;
}

interface AiQuizCheckDialogProps {
	open: boolean;
	submission: QuizSubmission | null;
	onClose: () => void;
	onMarked: (submissionId: string, totalEarned: number) => void;
}

const AiQuizCheckDialog = ({ open, submission, onClose, onMarked }: AiQuizCheckDialogProps) => {
	const baseUrl = import.meta.env.VITE_SERVER_BASE_URL;
	const { isSmallScreen, isRotatedMedium } = useContext(MediaQueryContext);
	const isMobileSize = isSmallScreen || isRotatedMedium;
	const { fetchQuestionTypeName, questionTypes } = useQuestionTypes();
	const { user, isInstructor } = useAuth();
	const { refreshDashboard, refreshQuizSubmissions } = useDashboardSync();
	const queryClient = useQueryClient();

	const [loading, setLoading] = useState(false);
	const [saving, setSaving] = useState(false);
	const [loadError, setLoadError] = useState('');
	const [saveError, setSaveError] = useState('');
	const [items, setItems] = useState<WritingDraftItem[]>([]);
	const [studentFirebaseId, setStudentFirebaseId] = useState('');
	const [courseName, setCourseName] = useState('');
	const [wasChecked, setWasChecked] = useState(false);

	useEffect(() => {
		if (!open || !submission?.userLessonId || !questionTypes.length) return;
		let cancelled = false;

		const load = async () => {
			setLoading(true);
			setLoadError('');
			setSaveError('');
			setItems([]);
			try {
				const data = await fetchSubmissionFeedback(submission.userLessonId, submission._id, baseUrl);
				if (cancelled) return;
				setStudentFirebaseId(data.student?.firebaseUserId || '');
				setCourseName(data.courseName || submission.courseName || '');
				setWasChecked(Boolean(data.isChecked));

				const writing = data.response.filter(
					(response) => fetchQuestionTypeName(response.questionId as never) === QuestionType.OPEN_ENDED
				);
				const nextItems: WritingDraftItem[] = writing.map((response) => {
					const question = response.questionId as { question?: string };
					const pointsPossible = response.pointsPossible ?? 0;
					const previousPoints = response.pointsEarned ?? 0;
					const questionHtml = sanitizeHtml(decode(question?.question || ''));
					const studentAnswer = String(response.userAnswer || '').trim();
					const hasSavedCheck = response.aiCheckScore != null || Boolean(String(response.aiCheckFeedback || '').trim());
					const savedScore = response.aiCheckScore != null ? Math.min(Math.max(Math.round(response.aiCheckScore), 0), pointsPossible) : previousPoints;
					return {
						userQuestionId: response._id,
						questionHtml,
						questionText: questionHtml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(),
						studentAnswer,
						feedback: hasSavedCheck ? String(response.aiCheckFeedback || '') : '',
						score: hasSavedCheck ? String(savedScore) : studentAnswer ? '' : '0',
						pointsPossible,
						previousPoints,
						drafting: Boolean(studentAnswer) && !hasSavedCheck,
						error: '',
					};
				});
				setItems(nextItems);
				setLoading(false);

				await Promise.all(
					nextItems.map(async (item) => {
						if (!item.drafting) return;
						try {
							const response = await axios.post(`${baseUrl}/ai/writing-feedback`, {
								question: item.questionText,
								studentAnswer: item.studentAnswer,
								chapterName: data.chapterName,
								courseId: data.courseId || submission.courseId,
								pointsPossible: item.pointsPossible,
							});
							const payload = response.data?.data;
							const feedback = String(payload?.feedback || '').trim().slice(0, 1000);
							const suggested = Number(payload?.score);
							const score = Number.isFinite(suggested)
								? String(Math.min(Math.max(Math.round(suggested), 0), item.pointsPossible))
								: '0';
							if (feedback) {
								await axios.patch(`${baseUrl}/userquestions/${item.userQuestionId}`, {
									aiCheckFeedback: feedback,
									aiCheckScore: Number(score),
								});
							}
							if (cancelled) return;
							setItems((current) =>
								current.map((row) =>
									row.userQuestionId === item.userQuestionId
										? { ...row, drafting: false, feedback: feedback || row.feedback, score, error: feedback ? '' : 'AI did not return feedback.' }
										: row
								)
							);
						} catch (error: any) {
							if (cancelled) return;
							const message =
								error?.response?.status === 429
									? 'AI is busy. Wait a minute and try again.'
									: error?.response?.data?.message || 'Could not draft feedback.';
							setItems((current) =>
								current.map((row) =>
									row.userQuestionId === item.userQuestionId ? { ...row, drafting: false, error: message } : row
								)
							);
						}
					})
				);
			} catch (error) {
				console.error(error);
				if (!cancelled) {
					setLoadError('Could not load this quiz.');
					setLoading(false);
				}
			}
		};

		load();
		return () => {
			cancelled = true;
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [open, submission?._id, submission?.userLessonId, submission?.courseId, questionTypes.length, baseUrl]);

	const drafting = items.some((item) => item.drafting);

	const updateItem = (userQuestionId: string, patch: Partial<WritingDraftItem>) => {
		setSaveError('');
		setItems((current) => current.map((item) => (item.userQuestionId === userQuestionId ? { ...item, ...patch, error: '' } : item)));
	};

	const markQuiz = async () => {
		if (!submission) return;
		const invalid = items.find((item) => {
			if (item.score.trim() === '') return true;
			const score = Number(item.score);
			return !Number.isInteger(score) || score < 0 || score > item.pointsPossible;
		});
		if (invalid) {
			setSaveError(`Enter a score from 0 to ${invalid.pointsPossible} for each writing question.`);
			return;
		}

		setSaving(true);
		setSaveError('');
		try {
			await Promise.all(
				items.map(async (item) => {
					const feedback = item.feedback.trim().slice(0, 1000);
					const score = Number(item.score);
					await axios.patch(`${baseUrl}/userquestions/${item.userQuestionId}`, {
						teacherFeedback: feedback,
						aiCheckFeedback: feedback,
						aiCheckScore: score,
					});
					await axios.patch(`${baseUrl}/userQuestions/${item.userQuestionId}/grade`, { pointsEarned: score });
				})
			);

			if (!wasChecked) {
				const updateEndpoint = isInstructor
					? `${baseUrl}/quizsubmissions/instructor/${submission._id}`
					: `${baseUrl}/quizsubmissions/${submission._id}`;
				await axios.patch(updateEndpoint, { isChecked: true });
			}

			const delta = items.reduce((sum, item) => sum + (Number(item.score) - item.previousPoints), 0);
			const nextTotal = Math.max(0, (submission.totalEarned ?? 0) + delta);

			if (studentFirebaseId) {
				const notificationData = {
					title: 'Quiz Checked',
					message: `${user?.username} checked ${submission.lessonName} in the ${courseName} course.`,
					isRead: false,
					timestamp: serverTimestamp(),
					type: 'QuizSubmission',
					userImageUrl: user?.imageUrl,
					lessonId: submission.lessonId,
					submissionId: submission._id,
					userLessonId: submission.userLessonId,
				};
				const batch = writeBatch(db);
				const notificationDocRef = doc(db, 'notifications', studentFirebaseId, 'userNotifications', submission._id || 'default');
				batch.set(notificationDocRef, notificationData, { merge: true });
				batch.commit().catch((error) => {
					console.warn('Failed to send quiz checked notification:', error);
				});
			}

			queryClient.invalidateQueries(submissionFeedbackQueryKey(submission.userLessonId, submission._id));
			refreshDashboard();
			refreshQuizSubmissions();
			onMarked(submission._id, nextTotal);
			onClose();
		} catch (error) {
			console.error(error);
			setSaveError('Could not save the score and feedback.');
		} finally {
			setSaving(false);
		}
	};

	return (
		<CustomDialog
			openModal={open}
			closeModal={onClose}
			disableDismiss={saving}
			title={submission ? `AI Check — ${submission.lessonName}` : 'AI Check'}
			maxWidth='md'>
			<Box sx={{ px: isMobileSize ? '1rem' : '1.5rem', pb: '0.25rem', maxHeight: '70vh', overflowY: 'auto' }}>
				{(loading || (!questionTypes.length && open)) && (
					<Box sx={{ display: 'flex', justifyContent: 'center', py: '2rem' }}>
						<CircularProgress size={28} />
					</Box>
				)}
				{loadError && (
					<Typography sx={{ color: '#ef5350', fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>{loadError}</Typography>
				)}
				{!loading && !loadError && items.length === 0 && questionTypes.length > 0 && (
					<Typography sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem', py: '1rem' }}>
						This submission has no open-ended answers.
					</Typography>
				)}
				{items.map((item, index) => (
					<Box
						key={item.userQuestionId}
						sx={{
							border: '1px solid rgba(0,0,0,0.08)',
							borderRadius: '0.5rem',
							p: isMobileSize ? '0.75rem' : '1rem',
							pb: isMobileSize ? '0.65rem' : '0.75rem',
							mb: '0.75rem',
							'&:last-of-type': { mb: 0 },
							backgroundColor: '#fff',
						}}>
						<Typography
							sx={{
								fontSize: isMobileSize ? '0.7rem' : '0.75rem',
								fontWeight: 700,
								letterSpacing: '0.02em',
								textTransform: 'uppercase',
								color: theme.palette.primary.main,
								mb: '0.4rem',
							}}>
							Question {index + 1}
						</Typography>
						<Box
							sx={{
								fontSize: isMobileSize ? '0.85rem' : '0.95rem',
								fontWeight: 600,
								lineHeight: 1.5,
								color: theme.palette.text.primary,
								mb: '0.85rem',
								'& p': { margin: '0 0 0.35rem' },
								'& p:last-child': { marginBottom: 0 },
							}}
							dangerouslySetInnerHTML={{ __html: item.questionHtml || '—' }}
						/>
						<Typography
							sx={{
								fontSize: isMobileSize ? '0.7rem' : '0.75rem',
								fontWeight: 700,
								letterSpacing: '0.02em',
								textTransform: 'uppercase',
								color: theme.palette.primary.main,
								mb: '0.4rem',
							}}>
							Student's answer
						</Typography>
						<Box
							sx={{
								backgroundColor: '#f1f5f9',
								borderRadius: '0.4rem',
								px: '0.75rem',
								py: '0.6rem',
								mb: '0.85rem',
							}}>
							<Typography
								sx={{
									fontSize: isMobileSize ? '0.85rem' : '0.95rem',
									fontWeight: 500,
									lineHeight: 1.5,
									color: theme.palette.text.primary,
									whiteSpace: 'pre-wrap',
								}}>
								{item.studentAnswer || 'No answer'}
							</Typography>
						</Box>
						<Typography sx={{ fontSize: isMobileSize ? '0.7rem' : '0.75rem', fontWeight: 700, mb: '0.25rem' }}>
							Feedback {item.drafting ? '· Writing...' : ''}
						</Typography>
						<CustomTextField
							multiline
							rows={5}
							resizable
							value={item.feedback}
							disabled={item.drafting || saving}
							onChange={(event) => updateItem(item.userQuestionId, { feedback: event.target.value.slice(0, 1000) })}
							placeholder='Feedback for the student (max 1000 characters)'
							sx={{ marginBottom: 0 }}
						/>
						<Typography sx={{ fontSize: '0.7rem', textAlign: 'right', mt: '0.2rem' }}>{item.feedback.length}/1000</Typography>
						<Box sx={{ display: 'flex', alignItems: 'center', gap: '0.75rem', mt: '0.35rem' }}>
							<Typography sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>Score</Typography>
							<CustomTextField
								type='number'
								fullWidth={false}
								required={false}
								value={item.score}
								disabled={item.drafting || saving}
								onChange={(event) => {
									const raw = event.target.value;
									if (raw === '') {
										updateItem(item.userQuestionId, { score: '' });
										return;
									}
									const value = Number(raw);
									if (Number.isInteger(value) && value >= 0 && value <= item.pointsPossible) {
										updateItem(item.userQuestionId, { score: String(value) });
									}
								}}
								sx={{ width: '4.5rem', marginBottom: 0 }}
								InputProps={{ inputProps: { min: 0, max: item.pointsPossible } }}
							/>
							<Typography sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem', color: theme.palette.text.secondary }}>
								/ {item.pointsPossible} pts
							</Typography>
						</Box>
						{item.error && (
							<Typography sx={{ color: '#ef5350', fontSize: isMobileSize ? '0.7rem' : '0.8rem', mt: '0.5rem' }}>{item.error}</Typography>
						)}
					</Box>
				))}
				{saveError && (
					<Typography sx={{ color: '#ef5350', fontSize: isMobileSize ? '0.75rem' : '0.85rem', mb: '0.5rem' }}>{saveError}</Typography>
				)}
			</Box>
			<CustomDialogActions
				onCancel={onClose}
				onSubmit={markQuiz}
				submitBtnText='Mark'
				submitBtnType='button'
				disableBtn={saving || loading || drafting || items.length === 0}
				disableCancelBtn={saving}
				isSubmitting={saving}
				actionSx={{ marginBottom: isMobileSize ? '0.35rem' : '0.5rem', pt: '0.35rem' }}
			/>
		</CustomDialog>
	);
};

export default AiQuizCheckDialog;
