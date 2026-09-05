import { Box, Card, Typography } from '@mui/material';
import theme from '../../../themes';
import { ReactNode, useContext } from 'react';
import { MediaQueryContext } from '../../../contexts/MediaQueryContextProvider';

interface CoursePageBannerDataCardProps {
	title: string;
	content: ReactNode;
	customSettings?: {
		bgColor?: string;
		color?: string;
		height?: object | string;
	};
	fromHomePage?: boolean;
}

const CoursePageBannerDataCard = ({ title, content, customSettings, fromHomePage }: CoursePageBannerDataCardProps) => {
	const { isRotated, isSmallScreen } = useContext(MediaQueryContext);

	const isMobileSize: boolean = isSmallScreen || isRotated;

	return (
		<Card
			sx={{
				display: 'flex',
				flexDirection: 'column',
				justifyContent: 'space-between',
				width: { xs: '5.5rem', sm: '6rem', md: '7rem' },
				height: customSettings?.height || { xs: '4rem', sm: '4rem', md: '6rem' },
				backgroundColor: customSettings?.bgColor || theme.bgColor?.common,
				borderRadius: '0.4rem',
				margin: '0 0.3rem 0.3rem 0',
				padding: '0.5rem 0.5rem 1rem 0.5rem',
			}}>
			<Typography
				sx={{
					fontSize: isMobileSize ? '0.6rem' : '0.8rem',
					color: customSettings?.color || 'inherit',
					fontFamily: fromHomePage ? 'Varela Round' : theme.fontFamily?.main,
					textAlign: 'center',
				}}>
				{title}
			</Typography>
			<Box
				sx={{
					color: customSettings?.color || theme.textColor?.primary.main,
					fontSize: isMobileSize ? '0.65rem' : '0.9rem',
					fontFamily: fromHomePage ? 'Varela Round' : theme.fontFamily?.main,
					textAlign: 'center',
					fontWeight: fromHomePage ? 900 : 500,
					lineHeight: 1.15,
				}}>
				{content}
			</Box>
		</Card>
	);
};

export default CoursePageBannerDataCard;
