import { Box, Typography } from '@mui/material';

interface ImageThumbnailProps {
	imgSource: string;
	boxStyle?: object;
	imgStyle?: React.CSSProperties;
	removeImage?: () => void;
}

const ImageThumbnail = ({ imgSource, boxStyle, imgStyle, removeImage }: ImageThumbnailProps) => {
	console.log(imgSource);
	return (
		<Box
			sx={{
				display: 'flex',
				flexDirection: 'column',
				justifyContent: 'center',
				alignItems: 'center',
				height: '9rem',
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
					width: '50%',
					height: '100%',
					...imgStyle,
				}}
			/>
			<Box>
				{imgSource !== 'https://savethefrogs.com/wp-content/uploads/placeholder-wire-image-white.jpg' &&
					imgSource !== 'https://directmobilityonline.co.uk/assets/img/noimage.png' && (
						<Typography
							variant='body2'
							sx={{ fontSize: '0.75rem', textDecoration: 'underline', cursor: 'pointer', marginTop: '0.5rem' }}
							onClick={removeImage}>
							Remove
						</Typography>
					)}
			</Box>
		</Box>
	);
};

export default ImageThumbnail;
