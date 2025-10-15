import { useContext, useState, useEffect } from 'react';
import { Box, Button, FormControl, IconButton, Input, Tooltip, Typography, Snackbar, Alert } from '@mui/material';
import { CloudUpload, PostAddOutlined } from '@mui/icons-material';
import theme from '../../../themes';
import CustomErrorMessage from '../customFields/CustomErrorMessage';
import CustomTextField from '../customFields/CustomTextField';
import useDocUpload from '../../../hooks/useDocUpload';
import AddNewDocumentDialog from '../../adminDocuments/AddNewDocumentDialog';
import { Lesson } from '../../../interfaces/lessons';
import LoadingButton from '@mui/lab/LoadingButton';
import { SingleCourse } from '../../../interfaces/course';
import { MediaQueryContext } from '../../../contexts/MediaQueryContextProvider';
import { validateDocumentUrl } from '../../../utils/urlValidation';

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
	singleCourseBeforeSave?: SingleCourse | undefined;
	setSingleCourseBeforeSave?: React.Dispatch<React.SetStateAction<SingleCourse | undefined>>;
	fromAdminCourses?: boolean | undefined;
	initialDocumentUrl?: string;
	initialDocumentName?: string;
	setHasUnsavedChanges?: React.Dispatch<React.SetStateAction<boolean>>;
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
	singleCourseBeforeSave,
	setSingleCourseBeforeSave,
	fromAdminCourses,
	initialDocumentUrl,
	initialDocumentName,
	setHasUnsavedChanges,
}: HandleDocUploadURLProps) => {
	const { docUpload, isDocSizeLarge, handleDocChange, resetDocUpload, handleDocUpload, isDocLoading } = useDocUpload();

	const { isSmallScreen, isRotatedMedium } = useContext(MediaQueryContext);
	const isMobileSize = isSmallScreen || isRotatedMedium;

	const [manualDocUrl, setManualDocUrl] = useState<string>('');
	const [docName, setDocName] = useState<string>('');
	const [isValidatingUrl, setIsValidatingUrl] = useState<boolean>(false);
	const [isUrlErrorOpen, setIsUrlErrorOpen] = useState<boolean>(false);
	const [urlErrorMessage, setUrlErrorMessage] = useState<string>('');

	// Set initial values when they change
	useEffect(() => {
		if (initialDocumentUrl) {
			setManualDocUrl(initialDocumentUrl);
			setEnterDocUrl(true);
			if (setDocumentUrl) {
				setDocumentUrl(initialDocumentUrl);
			}
		}
		if (initialDocumentName) {
			setDocName(initialDocumentName);
			if (setDocumentName) {
				setDocumentName(initialDocumentName);
			}
		}
	}, [initialDocumentUrl, initialDocumentName]);

	// Debounced URL validation
	useEffect(() => {
		if (!manualDocUrl.trim()) {
			return;
		}

		const timeoutId = setTimeout(async () => {
			try {
				const validation = await validateDocumentUrl(manualDocUrl.trim());
				if (!validation.isValid) {
					setUrlErrorMessage(validation.error || 'Invalid document URL');
					setIsUrlErrorOpen(true);
				}
			} catch (error) {
				// Don't show error for network issues during typing
			}
		}, 250); // 1 second delay

		return () => clearTimeout(timeoutId);
	}, [manualDocUrl]);

	const handleDocUploadReusable = () => {
		handleDocUpload(docFolderName, (url: string) => {
			if (onDocUploadLogic) {
				onDocUploadLogic(url, docName);
			}
			if (setDocumentName) setDocumentName(docName);
			if (setDocumentUrl) setDocumentUrl(url);
			if (setFileUploaded) setFileUploaded(true);

			// Don't clear the name when in admin docs mode
			if (!fromAdminDocs) {
				setDocName('');
			}
		});
	};

	const handleManualUrlAddition = async () => {
		if (manualDocUrl) {
			setIsValidatingUrl(true);

			try {
				// Validate the document URL
				const validation = await validateDocumentUrl(manualDocUrl);

				if (!validation.isValid) {
					setUrlErrorMessage(validation.error || 'Invalid document URL');
					setIsUrlErrorOpen(true);
					return;
				}

				if (onDocUploadLogic) {
					onDocUploadLogic(manualDocUrl, docName.trim());
				}

				if (setDocumentName) setDocumentName(docName.trim());
				if (setFileUploaded) setFileUploaded(true);
				if (setDocumentUrl) setDocumentUrl(manualDocUrl);

				// Don't clear the fields when in admin docs mode
				if (!fromAdminDocs) {
					setManualDocUrl('');
					setDocName('');
				}
			} catch (error) {
				setUrlErrorMessage('Failed to validate document URL');
				setIsUrlErrorOpen(true);
			} finally {
				setIsValidatingUrl(false);
			}
		}
	};

	return (
		<>
			<FormControl sx={{ display: 'flex', width: '100%' }}>
				<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
					<Typography variant={isMobileSize ? 'body2' : 'h6'} sx={{ fontSize: !isMobileSize ? '1rem' : '0.75rem' }}>
						{label}
					</Typography>
					<Box sx={{ display: 'flex', alignItems: 'center' }}>
						<Box>
							<Typography
								variant='body2'
								sx={{ textDecoration: !enterDocUrl ? 'underline' : 'none', cursor: 'pointer', fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}
								onClick={() => setEnterDocUrl(false)}>
								Choose
							</Typography>
						</Box>
						<Typography sx={{ margin: '0 0.5rem' }}> | </Typography>
						<Box>
							<Typography
								variant='body2'
								sx={{ textDecoration: enterDocUrl ? 'underline' : 'none', cursor: 'pointer', fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}
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
									<Tooltip title='Add from List' placement='top' arrow>
										<IconButton
											onClick={() => {
												if (setAddNewDocumentModalOpen) setAddNewDocumentModalOpen(true);
											}}
											size='small'>
											<PostAddOutlined fontSize='small' />
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
							singleCourse={singleCourseBeforeSave}
							setSingleCourse={setSingleCourseBeforeSave}
							fromAdminCourses={fromAdminCourses}
							setHasUnsavedChanges={setHasUnsavedChanges}
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
						InputProps={{
							inputProps: {
								maxLength: 50,
							},
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
										fontSize: '0.85rem',
									}}
								/>
								{!isDocLoading ? (
									<Button
										onClick={handleDocUploadReusable}
										variant='outlined'
										sx={{ textTransform: 'capitalize', height: '2rem', width: fromAdminDocs ? '17.5%' : '15%', ml: '0.55rem' }}
										disabled={!docUpload || isDocSizeLarge}
										size='small'>
										<CloudUpload />
									</Button>
								) : (
									<LoadingButton loading variant='outlined' sx={{ textTransform: 'capitalize', height: '2rem' }}>
										Upload
									</LoadingButton>
								)}
							</Box>
							{isDocSizeLarge && <CustomErrorMessage>Document size exceeds the limit of 10 MB </CustomErrorMessage>}
						</Box>
					)}

					{enterDocUrl && (
						<Box sx={{ display: 'flex', flexDirection: 'column', width: fromAdminDocs ? '60%' : '55%' }}>
							<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
								<Tooltip title='Click the upload button to enter/update the document URL' placement='top' arrow>
									<CustomTextField
										placeholder='Doc URL'
										required={enterDocUrl ? true : false}
										sx={{ width: fromAdminDocs ? '80%' : '82.5%', marginTop: '0.5rem' }}
										value={manualDocUrl}
										onChange={(e) => {
											setManualDocUrl(e.target.value);
										}}
									/>
								</Tooltip>

								{!isValidatingUrl ? (
									<Button
										onClick={handleManualUrlAddition}
										variant='outlined'
										sx={{ textTransform: 'capitalize', height: '2rem', width: fromAdminDocs ? '17.5%' : '15%', ml: '0.5rem', mb: '0.25rem' }}
										disabled={!manualDocUrl}
										size='small'>
										<CloudUpload />
									</Button>
								) : (
									<LoadingButton
										loading
										variant='outlined'
										sx={{ textTransform: 'capitalize', height: '2rem', width: fromAdminDocs ? '17.5%' : '15%', ml: '0.5rem', mb: '0.25rem' }}>
										Validating
									</LoadingButton>
								)}
							</Box>
						</Box>
					)}
				</Box>
			</FormControl>

			{/* Document URL validation error SnackBar */}
			<Snackbar
				open={isUrlErrorOpen}
				autoHideDuration={3500}
				anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
				onClose={() => setIsUrlErrorOpen(false)}>
				<Alert severity='error' variant='filled' sx={{ width: '100%' }}>
					{urlErrorMessage}
				</Alert>
			</Snackbar>
		</>
	);
};

export default HandleDocUploadURL;
