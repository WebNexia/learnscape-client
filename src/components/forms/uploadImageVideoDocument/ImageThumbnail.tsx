import { Box, Typography } from '@mui/material';
import { MediaQueryContext } from '../../../contexts/MediaQueryContextProvider';
import { useContext } from 'react';

interface ImageThumbnailProps {
	imgSource: string;
	boxStyle?: object;
	imgStyle?: React.CSSProperties;
	removeImage?: () => void;
	disableRemove?: boolean;
}

const ImageThumbnail = ({ imgSource, boxStyle, imgStyle, removeImage, disableRemove = false }: ImageThumbnailProps) => {
	const { isSmallScreen, isRotatedMedium } = useContext(MediaQueryContext);
	const isMobileSize = isSmallScreen || isRotatedMedium;
	return (
		<Box
			sx={{
				display: 'flex',
				flexDirection: 'column',
				justifyContent: 'center',
				alignItems: 'center',
				height: isMobileSize ? '6rem' : '8rem',
				width: '100%',
				marginTop: '1rem',
				...boxStyle,
			}}>
			<img
				src={imgSource}
				alt='image'
				style={{
					borderRadius: '0.2rem',
					boxShadow: '0 0.1rem 0.4rem 0.2rem rgba(0,0,0,0.3)',
					width: 'fit-content',
					height: '100%',
					objectFit: 'contain',
					...imgStyle,
				}}
			/>
			{!disableRemove && (
				<Box>
					{imgSource !== 'https://savethefrogs.com/wp-content/uploads/placeholder-wire-image-white.jpg' &&
						!imgSource?.includes('https://placehold.co/') && (
							<Typography
								variant='body2'
								sx={{ fontSize: '0.75rem', textDecoration: 'underline', cursor: 'pointer', marginTop: '0.5rem' }}
								onClick={removeImage}>
								Remove
							</Typography>
						)}
				</Box>
			)}
		</Box>
	);
};

export default ImageThumbnail;
