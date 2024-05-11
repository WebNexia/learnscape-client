import { Card, Typography } from '@mui/material';
import theme from '../../../themes';

interface CoursePageBannerDataCardProps {
	title: string;
	content: string | number;
	customSettings?: {
		bgColor?: string;
		color?: string;
	};
}

const CoursePageBannerDataCard = ({
	title,
	content,
	customSettings,
}: CoursePageBannerDataCardProps) => {
	return (
		<Card
			sx={{
				display: 'flex',
				flexDirection: 'column',
				justifyContent: 'space-between',
				width: '9rem',
				height: '6rem',
				backgroundColor: customSettings?.bgColor || theme.bgColor?.common,
				borderRadius: '0.4rem',
				margin: '0 0.3rem 0.3rem 0',
				padding: '0.5rem 0.5rem 1rem 0.5rem',
			}}>
			<Typography
				variant='body2'
				sx={{ fontSize: '0.85rem', color: customSettings?.color || 'inherit' }}>
				{title}
			</Typography>
			<Typography
				variant='body1'
				sx={{
					color: customSettings?.color || theme.textColor?.primary.main,
					fontSize: '1rem',
				}}>
				{content}
			</Typography>
		</Card>
	);
};

export default CoursePageBannerDataCard;
