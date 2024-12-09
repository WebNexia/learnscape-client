import { Card, Typography } from '@mui/material';
import theme from '../../../themes';
import { useContext } from 'react';
import { MediaQueryContext } from '../../../contexts/MediaQueryContextProvider';

interface CoursePageBannerDataCardProps {
	title: string;
	content: string | number;
	customSettings?: {
		bgColor?: string;
		color?: string;
	};
}

const CoursePageBannerDataCard = ({ title, content, customSettings }: CoursePageBannerDataCardProps) => {
	const { isRotated, isSmallScreen } = useContext(MediaQueryContext);

	const isMobileSize: boolean = isSmallScreen || isRotated;
	return (
		<Card
			sx={{
				display: 'flex',
				flexDirection: 'column',
				justifyContent: 'space-between',
				width: isMobileSize ? '5.5rem' : '9rem',
				height: isMobileSize ? '4rem' : '6rem',
				backgroundColor: customSettings?.bgColor || theme.bgColor?.common,
				borderRadius: '0.4rem',
				margin: '0 0.3rem 0.3rem 0',
				padding: '0.5rem 0.5rem 1rem 0.5rem',
			}}>
			<Typography sx={{ fontSize: isMobileSize ? '0.6rem' : '0.85rem', color: customSettings?.color || 'inherit' }}>{title}</Typography>
			<Typography
				sx={{
					color: customSettings?.color || theme.textColor?.primary.main,
					fontSize: isMobileSize ? '0.65rem' : '1rem',
				}}>
				{content}
			</Typography>
		</Card>
	);
};

export default CoursePageBannerDataCard;
