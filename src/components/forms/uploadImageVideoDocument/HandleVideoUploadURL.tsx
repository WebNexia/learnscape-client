import { CloudUpload } from '@mui/icons-material';
import LoadingButton from '@mui/lab/LoadingButton';
import { Box, Button, FormControl, Input, Typography } from '@mui/material';
import React, { ChangeEvent } from 'react';
import CustomErrorMessage from '../customFields/CustomErrorMessage';
import CustomTextField from '../customFields/CustomTextField';
import useVideoUpload from '../../../hooks/useVideoUpload';
import theme from '../../../themes';

interface HandleVideoUploadURLProps {
	onVideoUploadLogic: (url: string) => void;
	onChangeVideoUrl?: (e: ChangeEvent<HTMLInputElement>) => void;
	setEnterVideoUrl: React.Dispatch<React.SetStateAction<boolean>>;
	videoUrlValue?: string;
	videoFolderName: string;
	enterVideoUrl: boolean;
	label?: string;
}

const HandleVideoUploadURL = ({
	onVideoUploadLogic,
	onChangeVideoUrl,
	setEnterVideoUrl,
	videoUrlValue,
	videoFolderName,
	enterVideoUrl,
	label = 'Video',
}: HandleVideoUploadURLProps) => {
	const { videoUpload, isVideoSizeLarge, handleVideoChange, resetVideoUpload, handleVideoUpload, isVideoLoading } = useVideoUpload();

	const handleVideoUploadReusable = () => {
		handleVideoUpload(videoFolderName, (url: string) => {
			onVideoUploadLogic(url);
		});
	};
	return (
		<FormControl sx={{ display: 'flex' }}>
			<Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
				<Typography variant='h6'>{label}</Typography>
				<Box sx={{ display: 'flex', alignItems: 'center' }}>
					<Box>
						<Typography
							variant='body2'
							sx={{ textDecoration: !enterVideoUrl ? 'underline' : 'none', cursor: 'pointer' }}
							onClick={() => setEnterVideoUrl(false)}>
							Upload
						</Typography>
					</Box>
					<Typography sx={{ margin: '0 0.5rem' }}> | </Typography>
					<Box>
						<Typography
							variant='body2'
							sx={{ textDecoration: enterVideoUrl ? 'underline' : 'none', cursor: 'pointer' }}
							onClick={() => {
								setEnterVideoUrl(true);
								resetVideoUpload();
							}}>
							Enter URL
						</Typography>
					</Box>
				</Box>
			</Box>

			{!enterVideoUrl && (
				<>
					<Box sx={{ display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
						<Input
							type='file'
							onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
								handleVideoChange(e);
							}}
							inputProps={{ accept: 'video/*' }} // Specify accepted file types
							sx={{
								width: '82.5%',
								backgroundColor: theme.bgColor?.common,
								margin: '0.5rem 0 0.85rem 0',
								padding: '0.25rem',
							}}
						/>
						{!isVideoLoading ? (
							<Button
								variant='outlined'
								sx={{ textTransform: 'capitalize', height: '2rem', width: '15%' }}
								onClick={handleVideoUploadReusable}
								disabled={!videoUpload || isVideoSizeLarge}
								startIcon={<CloudUpload />}
								size='small'>
								Upload
							</Button>
						) : (
							<LoadingButton loading variant='outlined' sx={{ textTransform: 'capitalize', height: '2rem' }}>
								Upload
							</LoadingButton>
						)}
					</Box>
					{isVideoSizeLarge && <CustomErrorMessage> Please upload a video smaller than 30MB.</CustomErrorMessage>}
				</>
			)}

			{enterVideoUrl && (
				<CustomTextField placeholder='Video URL' required={false} sx={{ marginTop: '0.5rem' }} value={videoUrlValue} onChange={onChangeVideoUrl} />
			)}
		</FormControl>
	);
};

export default HandleVideoUploadURL;
