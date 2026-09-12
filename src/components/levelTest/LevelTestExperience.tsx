import {
	AssessmentOutlined,
	AutoAwesomeRounded,
	CheckCircleRounded,
	HeadphonesRounded,
	MailOutlineRounded,
	PlayArrowRounded,
	ReplayRounded,
	SchoolRounded,
} from '@mui/icons-material';
import { Alert, Box, Button, Chip, CircularProgress, LinearProgress, Paper, Typography } from '@mui/material';
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { getPassageForLevel, getStepsForLevel } from '../../utils/levelTest/content';
import {
	createInitialAssessmentState,
	getCompletedLevelResults,
	getCompletedPassageCount,
	submitPassage,
} from '../../utils/levelTest/engine';
import { buildResultCopy, getScoreEncouragement } from '../../utils/levelTest/resultCopy';
import { buildSkillInsights, getHeadlineScore, summarizeAttempt } from '../../utils/levelTest/skillInsights';
import type { AnswerSelection } from '../../utils/levelTest/types';
import LevelTestQuestions from './LevelTestQuestions';
import LevelTestReportDialog from './LevelTestReportDialog';
import ListeningPanel from './ListeningPanel';
import ReadingPanel from './ReadingPanel';
import { levelTestCardSx, levelTestHeadingSx, primaryButtonSx } from './styles';

type Stage = 'intro' | 'questions' | 'transition' | 'result';

const LevelTestExperience = () => {
	const [stage, setStage] = useState<Stage>('intro');
	const [assessment, setAssessment] = useState(createInitialAssessmentState);
	const [answers, setAnswers] = useState<AnswerSelection>({});
	const [stepIndex, setStepIndex] = useState(0);
	const [transitionReady, setTransitionReady] = useState(false);
	const [reportOpen, setReportOpen] = useState(false);
	const [durationMinutes, setDurationMinutes] = useState(1);
	const startedAt = useRef<number | null>(null);

	const currentSteps =
		assessment.currentLevel && assessment.currentPassageKind
			? getStepsForLevel(assessment.currentLevel, assessment.currentPassageKind)
			: [];
	const currentStep = currentSteps[stepIndex];
	const currentPassage =
		assessment.currentLevel && assessment.currentPassageKind
			? getPassageForLevel(assessment.currentLevel, assessment.currentPassageKind)
			: undefined;

	useEffect(() => {
		if (stage !== 'transition') return;
		const timer = window.setTimeout(() => setTransitionReady(true), 900);
		return () => window.clearTimeout(timer);
	}, [stage]);

	useEffect(() => {
		if (stage !== 'intro') window.scrollTo({ top: 0, behavior: 'auto' });
	}, [stage, stepIndex, assessment.currentLevel, assessment.currentPassageKind]);

	const start = () => {
		startedAt.current = Date.now();
		setAssessment(createInitialAssessmentState());
		setAnswers({});
		setStepIndex(0);
		setStage('questions');
	};

	const next = () => {
		if (!currentStep || !currentPassage) return;
		if (stepIndex < currentSteps.length - 1) {
			setStepIndex((value) => value + 1);
			return;
		}
		const nextAssessment = submitPassage(assessment, currentPassage, answers);
		setAssessment(nextAssessment);
		setAnswers({});
		setStepIndex(0);
		if (nextAssessment.testComplete) {
			const elapsed = startedAt.current ? Date.now() - startedAt.current : 0;
			setDurationMinutes(Math.max(1, Math.round(elapsed / 60000)));
			setStage('result');
		} else {
			setTransitionReady(false);
			setStage('transition');
		}
	};

	if (stage === 'intro') {
		return (
			<Box>
				<Paper
					component='section'
					elevation={0}
					sx={{
						...levelTestCardSx,
						position: 'relative',
						overflow: 'hidden',
						p: { xs: 3, sm: 5, md: 6 },
						textAlign: 'center',
						background:
							'radial-gradient(circle at 12% 10%, rgba(0,82,163,.15), transparent 34%), radial-gradient(circle at 90% 90%, rgba(255,107,61,.13), transparent 30%), #fff',
					}}>
					<AssessmentOutlined sx={{ color: '#FF6B3D', fontSize: { xs: 50, sm: 64 } }} />
					<Typography component='h1' sx={{ ...levelTestHeadingSx, mt: 1, fontSize: { xs: '2rem', sm: '3rem' } }}>
						Ücretsiz İngilizce Seviye Testi
					</Typography>
					<Typography sx={{ maxWidth: 720, mx: 'auto', mt: 1.5, color: '#526675', fontSize: { xs: '1rem', sm: '1.12rem' }, lineHeight: 1.7 }}>
						Kısa okuma metinleri ve tarayıcının seslendirdiği kısa dinleme bölümleriyle seviyeni A1–C2 aralığında tahmin et.
					</Typography>
					<Box sx={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 1, my: 3 }}>
						{['5–10 dakika', 'Kayıt gerekmez', 'B1 seviyesinden uyarlanır', 'Sonuç hemen görünür'].map((label) => (
							<Chip key={label} label={label} sx={{ bgcolor: '#eef6fc', color: '#01435A', fontWeight: 700 }} />
						))}
					</Box>
					<Alert severity='info' icon={<HeadphonesRounded />} sx={{ maxWidth: 720, mx: 'auto', mb: 3, textAlign: 'left' }}>
						Bu test okuma ve kısa dinleme anlama becerilerini ölçer; konuşma ve yazma becerilerini ölçmez ve resmî sertifika değildir.
					</Alert>
					<Button variant='contained' size='large' onClick={start} startIcon={<PlayArrowRounded />} sx={{ ...primaryButtonSx, px: 4, py: 1.3 }}>
						Teste başla
					</Button>
				</Paper>
				<Box sx={{ mt: 2.5, ...levelTestCardSx, p: { xs: 2.5, sm: 3 }, textAlign: 'center' }}>
					<Typography sx={{ ...levelTestHeadingSx, fontSize: '1.15rem' }}>İngilizceni geliştirmeye hazır mısın?</Typography>
					<Typography sx={{ color: '#526675', mt: 0.75, mb: 1.5 }}>Aden Academy kurslarını incele ve seviyene uygun bir sonraki adımı seç.</Typography>
					<Button component={Link} to='/landing-page-courses' variant='outlined' sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 700 }}>
						Kursları keşfet
					</Button>
				</Box>
			</Box>
		);
	}

	if (stage === 'transition') {
		return (
			<Box sx={{ ...levelTestCardSx, minHeight: 390, p: 4, display: 'grid', placeItems: 'center', textAlign: 'center' }}>
				<Box>
					{transitionReady ? <CheckCircleRounded sx={{ color: '#2e9c5d', fontSize: 70 }} /> : <CircularProgress size={66} sx={{ color: '#0052a3' }} />}
					<Typography component='h2' sx={{ ...levelTestHeadingSx, mt: 2, fontSize: '1.7rem' }}>
						{transitionReady ? 'Sıradaki bölüm hazır' : 'Cevapların değerlendiriliyor'}
					</Typography>
					<Typography sx={{ color: '#526675', mt: 1, mb: 2.5 }}>
						{transitionReady ? 'Yanıtlarına göre bir sonraki seviye seçildi.' : 'Uyarlanabilir test sıradaki adımı belirliyor.'}
					</Typography>
					<Button
						variant='contained'
						disabled={!transitionReady}
						onClick={() => setStage('questions')}
						sx={{ ...primaryButtonSx, px: 4 }}>
						Devam et
					</Button>
				</Box>
			</Box>
		);
	}

	if (stage === 'result' && assessment.outcome) {
		const results = getCompletedLevelResults(assessment);
		const copy = buildResultCopy(assessment.outcome);
		const score = getHeadlineScore(results);
		const totals = summarizeAttempt(results);
		const skills = buildSkillInsights(results);
		return (
			<Box sx={{ display: 'grid', gap: 2 }}>
				<Box
					component='section'
					sx={{
						...levelTestCardSx,
						p: { xs: 3, sm: 4 },
						display: 'grid',
						gridTemplateColumns: { xs: '1fr', md: '1.1fr .9fr' },
						gap: 3,
						alignItems: 'center',
					}}>
					<Box sx={{ textAlign: { xs: 'center', md: 'left' } }}>
						<Chip label={copy.badgeLabel} sx={{ bgcolor: '#fff0ea', color: '#b83f1b', fontWeight: 700 }} />
						<Typography sx={{ color: '#6d7f87', mt: 1.5 }}>Tahmini İngilizce okuma seviyen</Typography>
						<Typography component='h1' sx={{ ...levelTestHeadingSx, color: '#0052a3', fontSize: { xs: '4rem', sm: '5rem' }, lineHeight: 1 }}>
							{copy.resultLabel}
						</Typography>
						<Typography sx={{ color: '#01435A', fontSize: '1.3rem', fontWeight: 700 }}>{copy.resultBandLabel}</Typography>
						{copy.approachingNote ? <Chip label={copy.approachingNote} sx={{ mt: 1.5, bgcolor: '#eef6fc', color: '#0052a3' }} /> : null}
						<Typography sx={{ color: '#526675', mt: 2, lineHeight: 1.7 }}>{copy.lead}</Typography>
					</Box>
					<Box sx={{ textAlign: 'center', p: 3, borderRadius: 4, bgcolor: '#f4f9fc' }}>
						<Typography sx={{ color: '#6d7f87', fontWeight: 700 }}>Genel anlama puanın</Typography>
						<Typography sx={{ ...levelTestHeadingSx, color: '#FF6B3D', fontSize: '3.5rem' }}>%{score}</Typography>
						<Typography sx={{ color: '#2e7d51', fontWeight: 700 }}>{getScoreEncouragement(score)}</Typography>
						<Typography sx={{ color: '#6d7f87', mt: 1 }}>{totals.correct} doğru / {totals.total} soru · {durationMinutes} dakika</Typography>
					</Box>
				</Box>

				<Button variant='contained' startIcon={<MailOutlineRounded />} onClick={() => setReportOpen(true)} sx={{ ...primaryButtonSx, py: 1.3 }}>
					Detaylı PDF raporunu e-postana gönder
				</Button>

				<Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
					<Box sx={{ ...levelTestCardSx, p: 3 }}>
						<Typography component='h2' sx={{ ...levelTestHeadingSx, fontSize: '1.2rem' }}>Bu ne anlama geliyor?</Typography>
						{copy.meaningParagraphs.map((paragraph) => (
							<Typography key={paragraph} sx={{ color: '#526675', mt: 1.25, lineHeight: 1.7 }}>{paragraph}</Typography>
						))}
					</Box>
					<Box sx={{ ...levelTestCardSx, p: 3 }}>
						<Typography component='h2' sx={{ ...levelTestHeadingSx, fontSize: '1.2rem' }}>Beceri özeti</Typography>
						<Box sx={{ mt: 1.5, display: 'grid', gap: 1 }}>
							{skills.map((skill) => (
								<Box key={skill.id} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
									<Typography sx={{ color: '#263f49', fontWeight: 700 }}>{skill.label}</Typography>
									<Chip label={`${skill.statusLabel} · ${skill.correct}/${skill.total}`} size='small' sx={{ bgcolor: skill.status === 'developing' ? '#fff0ea' : '#eaf7ef', color: '#01435A' }} />
								</Box>
							))}
						</Box>
					</Box>
				</Box>

				<Box sx={{ ...levelTestCardSx, p: 3, textAlign: 'center', background: 'linear-gradient(135deg, #eef7fc, #fff)' }}>
					<SchoolRounded sx={{ color: '#FF6B3D', fontSize: 36 }} />
					<Typography component='h2' sx={{ ...levelTestHeadingSx, fontSize: '1.25rem' }}>{copy.nextGoalTitle}</Typography>
					<Typography sx={{ maxWidth: 700, mx: 'auto', color: '#526675', mt: 1, lineHeight: 1.7 }}>{copy.nextGoalLead}</Typography>
					<Box component='ul' sx={{ maxWidth: 650, mx: 'auto', textAlign: 'left', color: '#526675', lineHeight: 1.7 }}>
						{copy.nextGoalTips.map((tip) => <li key={tip}>{tip}</li>)}
					</Box>
					<Button component={Link} to='/landing-page-courses' variant='contained' sx={{ ...primaryButtonSx, mt: 1 }}>Aden Academy kurslarını keşfet</Button>
				</Box>

				<Alert severity='info'>
					Bu sonuç resmî bir sertifika değildir; okuma ve kısa dinleme sorularındaki performansına dayanan bir tahmindir. Konuşma ve yazma değerlendirilmemiştir.
				</Alert>
				<Button variant='text' onClick={start} startIcon={<ReplayRounded />} sx={{ color: '#0052a3', fontWeight: 700, textTransform: 'none' }}>
					Testi tekrarla
				</Button>
				<LevelTestReportDialog
					open={reportOpen}
					onClose={() => setReportOpen(false)}
					results={results}
					contentVersion={assessment.contentVersion}
				/>
			</Box>
		);
	}

	if (!currentStep || !currentPassage) {
		return <Alert severity='error'>Test içeriği yüklenemedi. Lütfen sayfayı yenileyip tekrar dene.</Alert>;
	}

	const answered = currentStep.questions.filter((question) => Boolean(answers[question.id])).length;
	const isListening = currentStep.format === 'listening';
	const lastStep = stepIndex === currentSteps.length - 1;

	return (
		<Box component='section'>
			<Box sx={{ ...levelTestCardSx, p: 2, mb: 2, position: 'sticky', top: 0, zIndex: 5 }}>
				<Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, alignItems: 'center', mb: 1 }}>
					<Box>
						<Typography sx={{ ...levelTestHeadingSx }}>{isListening ? 'Dinleme' : 'Okuma'} bölümü</Typography>
						<Typography sx={{ color: '#6d7f87', fontSize: '.78rem' }}>
							{getCompletedPassageCount(assessment) + 1}. bölüm · {stepIndex + 1}/{currentSteps.length}
						</Typography>
					</Box>
					<Chip label={`${answered}/${currentStep.questions.length} cevaplandı`} sx={{ bgcolor: '#eef6fc', color: '#0052a3' }} />
				</Box>
				<LinearProgress
					variant='determinate'
					value={(answered / currentStep.questions.length) * 100}
					sx={{ height: 7, borderRadius: 99, bgcolor: '#dce9ef', '& .MuiLinearProgress-bar': { bgcolor: '#FF6B3D' } }}
				/>
			</Box>
			<Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '.9fr 1.1fr' }, gap: 2.5, alignItems: 'start' }}>
				{isListening ? <ListeningPanel script={currentStep.listeningScript ?? []} /> : <ReadingPanel paragraphs={currentStep.paragraphs} />}
				<Box>
					<Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
						<AutoAwesomeRounded sx={{ color: '#FF6B3D' }} />
						<Typography component='h2' sx={{ ...levelTestHeadingSx, fontSize: '1.2rem' }}>Sorular</Typography>
					</Box>
					<LevelTestQuestions
						questions={currentStep.questions}
						answers={answers}
						onChange={(questionId, value) => setAnswers((previous) => ({ ...previous, [questionId]: value }))}
					/>
					<Button variant='contained' fullWidth size='large' onClick={next} sx={{ ...primaryButtonSx, mt: 2.5, py: 1.25 }}>
						{lastStep ? 'Cevapları gönder' : 'Devam et'}
					</Button>
					<Typography sx={{ color: '#82939a', mt: 1, textAlign: 'center', fontSize: '.82rem' }}>
						Boş bıraktığın sorular yanlış sayılır; doğru cevaplar test sırasında gösterilmez.
					</Typography>
				</Box>
			</Box>
		</Box>
	);
};

export default LevelTestExperience;
