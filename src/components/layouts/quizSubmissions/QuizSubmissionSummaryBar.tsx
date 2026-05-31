import { ReactNode } from 'react';
import { Box, Chip, Typography } from '@mui/material';
import { AssignmentOutlined, CheckCircleOutline, MenuBookOutlined, PendingActionsOutlined, TagOutlined } from '@mui/icons-material';
import theme from '../../../themes';

const accent = theme.bgColor?.greenPrimary ?? '#1EC28B';
const labelColor = theme.textColor?.secondary?.main ?? '#4D7B8B';
const valueColor = theme.textColor?.primary?.main ?? '#01435A';

type SummaryItem = {
	key: string;
	label: string;
	value: string;
	icon: ReactNode;
	isStatus?: boolean;
	checked?: boolean;
};

type QuizSubmissionSummaryBarProps = {
	quizName: string;
	chapterName: string;
	courseName: string;
	isChecked: boolean;
	compact?: boolean;
};

const iconBoxSx = (compact?: boolean) => ({
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center',
	width: compact ? '2rem' : '2.35rem',
	height: compact ? '2rem' : '2.35rem',
	borderRadius: '0.5rem',
	backgroundColor: 'rgba(30, 194, 139, 0.12)',
	color: accent,
	flexShrink: 0,
});

const QuizSubmissionSummaryBar = ({ quizName, chapterName, courseName, isChecked, compact }: QuizSubmissionSummaryBarProps) => {
	const items: SummaryItem[] = [
		{
			key: 'quiz',
			label: 'Quiz Name',
			value: quizName || '—',
			icon: <AssignmentOutlined sx={{ fontSize: compact ? '1.1rem' : '1.25rem' }} />,
		},
		{
			key: 'chapter',
			label: 'Chapter',
			value: chapterName || '—',
			icon: <TagOutlined sx={{ fontSize: compact ? '1.1rem' : '1.25rem' }} />,
		},
		{
			key: 'course',
			label: 'Course Name',
			value: courseName || '—',
			icon: <MenuBookOutlined sx={{ fontSize: compact ? '1.1rem' : '1.25rem' }} />,
		},
		{
			key: 'status',
			label: 'Status',
			value: isChecked ? 'Checked' : 'Unchecked',
			icon: isChecked ? (
				<CheckCircleOutline sx={{ fontSize: compact ? '1.1rem' : '1.25rem' }} />
			) : (
				<PendingActionsOutlined sx={{ fontSize: compact ? '1.1rem' : '1.25rem' }} />
			),
			isStatus: true,
			checked: isChecked,
		},
	];

	return (
		<Box
			sx={{
				width: '100%',
				display: 'grid',
				gridTemplateColumns: compact ? 'repeat(2, minmax(0, 1fr))' : { xs: 'repeat(2, minmax(0, 1fr))', md: 'repeat(4, minmax(0, 1fr))' },
				gap: compact ? '0.65rem' : { xs: '0.75rem', sm: '1rem' },
				p: compact ? '0.85rem' : { xs: '1rem', sm: '1.15rem 1.25rem' },
				borderRadius: '0.65rem',
				border: '1px solid rgba(1, 67, 90, 0.1)',
				background: 'linear-gradient(135deg, rgba(30, 194, 139, 0.06) 0%, rgba(255, 255, 255, 1) 55%)',
				boxShadow: '0 0.12rem 0.35rem rgba(1, 67, 90, 0.08)',
			}}>
			{items.map((item) => (
				<Box
					key={item.key}
					sx={{
						display: 'flex',
						alignItems: 'flex-start',
						gap: compact ? '0.5rem' : '0.65rem',
						minWidth: 0,
						p: compact ? '0.35rem' : { xs: '0.25rem', sm: '0.35rem' },
					}}>
					<Box sx={iconBoxSx(compact)}>{item.icon}</Box>
					<Box sx={{ minWidth: 0, flex: 1 }}>
						<Typography
							variant='caption'
							sx={{
								display: 'block',
								color: labelColor,
								fontWeight: 600,
								letterSpacing: '0.04em',
								textTransform: 'uppercase',
								fontSize: compact ? '0.6rem' : { xs: '0.62rem', sm: '0.68rem' },
								mb: '0.2rem',
								lineHeight: 1.2,
							}}>
							{item.label}
						</Typography>
						{item.isStatus ? (
							<Chip
								label={item.value}
								size='small'
								sx={{
									height: compact ? '1.35rem' : '1.5rem',
									fontWeight: 600,
									fontSize: compact ? '0.68rem' : '0.75rem',
									fontFamily: 'Poppins, sans-serif',
									backgroundColor: item.checked ? 'rgba(30, 194, 139, 0.18)' : 'rgba(77, 123, 139, 0.14)',
									color: item.checked ? accent : labelColor,
									border: `1px solid ${item.checked ? 'rgba(30, 194, 139, 0.35)' : 'rgba(77, 123, 139, 0.25)'}`,
								}}
							/>
						) : (
							<Typography
								variant='body2'
								sx={{
									fontWeight: 600,
									color: valueColor,
									fontSize: compact ? '0.78rem' : { xs: '0.82rem', sm: '0.9rem' },
									lineHeight: 1.35,
									overflow: 'hidden',
									textOverflow: 'ellipsis',
									whiteSpace: 'nowrap',
								}}
								title={item.value}>
								{item.value}
							</Typography>
						)}
					</Box>
				</Box>
			))}
		</Box>
	);
};

export default QuizSubmissionSummaryBar;
