import { useState } from 'react';
import { Box, Button, FormControl, IconButton, Input, Tooltip, Typography } from '@mui/material';
import { Article, CloudUpload, PostAddOutlined } from '@mui/icons-material';
import theme from '../../../themes';
import CustomErrorMessage from '../customFields/CustomErrorMessage';
import CustomTextField from '../customFields/CustomTextField';
import useDocUpload from '../../../hooks/useDocUpload';
import AddNewDocumentDialog from '../../adminSingleLesson/AddNewDocumentDialog';
import { Lesson } from '../../../interfaces/lessons';
import LoadingButton from '@mui/lab/LoadingButton';
import { SingleCourse } from '../../../interfaces/course';

interface HandleDocUploadURLProps {
	onDocUploadLogic?: (url: string, docName: string) => void;
	setEnterDocUrl: React.Dispatch<React.SetStateAction<boolean>>;
	docFolderName: string;
	enterDocUrl: boolean;
	label?: string;
	fromAdminDocs?: boolean;
	setDocumentUrl?: React.Dispatch<React.SetStateAction<string>>;
	setDocumentName?: React.Dispatch<React.SetStateAction<string>>;
	setFileUploaded?: React.Dispatch<React.SetStateAction<boolean>>;
	addNewDocumentModalOpen?: boolean;
	setAddNewDocumentModalOpen?: React.Dispatch<React.SetStateAction<boolean>>;
	setSingleLessonBeforeSave?: React.Dispatch<React.SetStateAction<Lesson>>;
	singleLessonBeforeSave?: Lesson;
	setIsLessonUpdated?: React.Dispatch<React.SetStateAction<boolean>>;
	singleCourse?: SingleCourse | undefined;
	setSingleCourse?: React.Dispatch<React.SetStateAction<SingleCourse | undefined>>;
	fromAdminCourses?: boolean | undefined;
}

const HandleDocUploadURL = ({
	onDocUploadLogic,
	setEnterDocUrl,
	docFolderName,
	enterDocUrl,
	label = 'Document Upload',
	fromAdminDocs = false,
	setDocumentUrl,
	setDocumentName,
	setFileUploaded,
	addNewDocumentModalOpen,
	setAddNewDocumentModalOpen,
	setSingleLessonBeforeSave,
	singleLessonBeforeSave,
	setIsLessonUpdated,
	singleCourse,
	setSingleCourse,
	fromAdminCourses,
}: HandleDocUploadURLProps) => {
	const { docUpload, isDocSizeLarge, handleDocChange, resetDocUpload, handleDocUpload, isDocLoading } = useDocUpload();
	const [manualDocUrl, setManualDocUrl] = useState<string>('');
	const [docName, setDocName] = useState<string>('');

	const handleDocUploadReusable = () => {
		handleDocUpload(docFolderName, (url: string) => {
			if (onDocUploadLogic) {
				onDocUploadLogic(url, docName);
			}
			if (setDocumentName) setDocumentName(docName);

			if (setDocumentUrl) setDocumentUrl(url);

			if (setFileUploaded) setFileUploaded(true);
			if (!fromAdminDocs) setDocName('');
		});
	};

	const handleManualUrlAddition = () => {
		if (manualDocUrl) {
			if (onDocUploadLogic) {
				onDocUploadLogic(manualDocUrl, docName);
			}

			if (setDocumentName) setDocumentName(docName);
			if (setFileUploaded) setFileUploaded(true);
			if (setDocumentUrl) setDocumentUrl(manualDocUrl);
			if (!fromAdminDocs) {
				setManualDocUrl('');
				setDocName('');
			}
		}
	};

	return (
		<FormControl sx={{ display: 'flex' }}>
			<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
				<Typography variant='h6'>{label}</Typography>
				<Box sx={{ display: 'flex', alignItems: 'center' }}>
					<Box>
						<Typography
							variant='body2'
							sx={{ textDecoration: !enterDocUrl ? 'underline' : 'none', cursor: 'pointer' }}
							onClick={() => setEnterDocUrl(false)}>
							Upload
						</Typography>
					</Box>
					<Typography sx={{ margin: '0 0.5rem' }}> | </Typography>
					<Box>
						<Typography
							variant='body2'
							sx={{ textDecoration: enterDocUrl ? 'underline' : 'none', cursor: 'pointer' }}
							onClick={() => {
								setEnterDocUrl(true);
								resetDocUpload();
							}}>
							Enter URL
						</Typography>
					</Box>
					{!fromAdminDocs && (
						<>
							<Typography sx={{ margin: '0 0.5rem' }}> | </Typography>
							<Box>
								<Tooltip title='Add from List' placement='top'>
									<IconButton
										onClick={() => {
											if (setAddNewDocumentModalOpen) setAddNewDocumentModalOpen(true);
										}}
										size='small'>
										<PostAddOutlined />
									</IconButton>
								</Tooltip>
							</Box>
						</>
					)}
					<AddNewDocumentDialog
						addNewDocumentModalOpen={addNewDocumentModalOpen}
						setAddNewDocumentModalOpen={setAddNewDocumentModalOpen}
						setSingleLessonBeforeSave={setSingleLessonBeforeSave}
						singleLessonBeforeSave={singleLessonBeforeSave}
						setIsLessonUpdated={setIsLessonUpdated}
						singleCourse={singleCourse}
						setSingleCourse={setSingleCourse}
						fromAdminCourses={fromAdminCourses}
					/>
				</Box>
			</Box>

			<Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
				<CustomTextField
					placeholder='Doc Name'
					required={true}
					sx={{ width: fromAdminDocs ? '37.5%' : '42.5%', marginTop: '0.5rem' }}
					value={docName}
					onChange={(e) => {
						setDocName(e.target.value);
						if (setDocumentName && fromAdminDocs) {
							setDocumentName(e.target.value);
						}
					}}
				/>

				{!enterDocUrl && (
					<Box sx={{ display: 'flex', flexDirection: 'column', width: fromAdminDocs ? '60%' : '55%', alignItems: 'flex-start' }}>
						<Box sx={{ display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
							<Input
								type='file'
								required={enterDocUrl ? false : true}
								onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
									handleDocChange(e);
								}}
								inputProps={{ accept: '.pdf' }}
								sx={{
									width: fromAdminDocs ? '80%' : '82.5%',
									backgroundColor: theme.bgColor?.common,
									margin: '0.5rem 0 0.85rem 0',
									padding: '0.25rem',
								}}
							/>
							{!isDocLoading ? (
								<Button
									onClick={handleDocUploadReusable}
									variant='outlined'
									sx={{ textTransform: 'capitalize', height: '2rem', width: fromAdminDocs ? '17.5%' : '15%' }}
									disabled={!docUpload || isDocSizeLarge}
									size='small'
									startIcon={<CloudUpload />}>
									Upload
								</Button>
							) : (
								<LoadingButton loading variant='outlined' sx={{ textTransform: 'capitalize', height: '2rem' }}>
									Upload
								</LoadingButton>
							)}
						</Box>
						{isDocSizeLarge && <CustomErrorMessage>Document size exceeds the limit of 1 MB </CustomErrorMessage>}
					</Box>
				)}

				{enterDocUrl && (
					<Box sx={{ display: 'flex', width: fromAdminDocs ? '60%' : '55%', justifyContent: 'space-between', alignItems: 'center' }}>
						<CustomTextField
							placeholder='Doc URL'
							required={enterDocUrl ? true : false}
							sx={{ width: fromAdminDocs ? '80%' : '82.5%', marginTop: '0.5rem' }}
							value={manualDocUrl}
							onChange={(e) => setManualDocUrl(e.target.value)}
						/>

						<Button
							onClick={handleManualUrlAddition}
							variant='outlined'
							sx={{ textTransform: 'capitalize', height: '2rem', width: fromAdminDocs ? '17.5%' : '15%' }}
							disabled={!manualDocUrl}
							size='small'
							startIcon={<Article />}>
							Upload
						</Button>
					</Box>
				)}
			</Box>
		</FormControl>
	);
};

export default HandleDocUploadURL;
