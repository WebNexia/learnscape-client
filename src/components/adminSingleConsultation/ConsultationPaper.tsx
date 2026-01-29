import { Alert, Box, Button, IconButton, Paper, Snackbar, Tooltip, Typography } from '@mui/material';
import theme from '../../themes';
import { useNavigate, useParams } from 'react-router-dom';
import { Edit, Info, KeyboardBackspaceOutlined, Event, EventAvailable } from '@mui/icons-material';
import { Consultation } from '../../interfaces/consultation';
import CustomSubmitButton from '../forms/customButtons/CustomSubmitButton';
import { LoadingButton } from '@mui/lab';
import { FormEvent, useContext, useState } from 'react';
import CustomCancelButton from '../forms/customButtons/CustomCancelButton';
import { useStickyPaper } from '../../hooks/useStickyPaper';
import { MediaQueryContext } from '../../contexts/MediaQueryContextProvider';
import ConsultationDetailsModal from '../consultations/ConsultationDetailsModal';
import { useAuth } from '../../hooks/useAuth';

interface ConsultationPaperProps {
	singleConsultation?: Consultation;
	singleConsultationBeforeSave: Consultation | undefined;
	isEditMode: boolean;
	isMissingFieldMsgOpen: boolean;
	setIsEditMode: React.Dispatch<React.SetStateAction<boolean>>;
	setIsMissingFieldMsgOpen: React.Dispatch<React.SetStateAction<boolean>>;
	setIsMissingField: React.Dispatch<React.SetStateAction<boolean>>;
	handlePublishing: () => void;
	handleConsultationUpdate: (event: React.FormEvent<Element>) => void;
	hasUnsavedChanges: boolean;
	setHasUnsavedChanges: React.Dispatch<React.SetStateAction<boolean>>;
	setSingleConsultationBeforeSave: React.Dispatch<React.SetStateAction<Consultation | undefined>>;
	isSaving: boolean;
}

const ConsultationPaper = ({
	singleConsultation,
	singleConsultationBeforeSave,
	isEditMode,
	isMissingFieldMsgOpen,
	setIsEditMode,
	setIsMissingFieldMsgOpen,
	setIsMissingField,
	handlePublishing,
	handleConsultationUpdate,
	hasUnsavedChanges,
	setHasUnsavedChanges,
	setSingleConsultationBeforeSave,
	isSaving,
}: ConsultationPaperProps) => {
	const navigate = useNavigate();
	const { consultationId } = useParams();
	const vertical = 'top';
	const horizontal = 'center';

	const { isSmallScreen, isRotatedMedium } = useContext(MediaQueryContext);
	const { hasAdminAccess } = useAuth();

	const isMobileSize = isSmallScreen || isRotatedMedium;

	const { isSticky, paperRef } = useStickyPaper(isMobileSize);

	const handleCancel = async (): Promise<void> => {
		setIsEditMode(false);
		setHasUnsavedChanges(false);
		setSingleConsultationBeforeSave(singleConsultation);
		window.scrollTo({ top: 0, behavior: 'smooth' });
	};

	const [isConsultationInfoDialogOpen, setIsConsultationInfoDialogOpen] = useState<boolean>(false);

	return (
		<Paper
			ref={paperRef}
			elevation={10}
			sx={{
				width: isSticky ? (isMobileSize ? '100%' : 'calc(100% - 10rem)') : '100%',
				height: isSticky ? '3rem' : '6rem',
				marginTop: isSticky ? 0 : '1.25rem',
				backgroundColor: hasAdminAccess ? theme.bgColor?.adminPaper : theme.bgColor?.instructorPaper,
				position: isSticky ? 'fixed' : 'relative',
				top: isSticky ? (isMobileSize ? '3.5rem' : '4rem') : 'auto',
				left: isSticky ? (isMobileSize ? '0' : '10rem') : 'auto',
				right: isSticky ? 0 : 'auto',
				zIndex: isSticky ? 1000 : 'auto',
				transition: 'all 0.5s ease',
				borderRadius: isSticky ? 0 : undefined,
			}}>
			<Box
				sx={{
					display: 'flex',
					justifyContent: 'space-between',
					height: '100%',
					width: '100%',
				}}>
				<Box
					sx={{
						display: 'flex',
						flexDirection: isSticky ? 'row' : 'column',
						justifyContent: isSticky ? 'flex-start' : 'space-between',
						alignItems: isSticky ? 'center' : 'flex-start',
						flex: { sm: 1, md: 1, lg: 2 },
						padding: isSticky ? (isMobileSize ? '0.25rem 0.25rem' : '0.5rem 1rem') : '0.5rem',
					}}>
					<Box sx={{ display: 'flex', alignItems: 'center', gap: isSticky ? '0.5rem' : '1rem', flexDirection: isSticky ? 'row' : 'column' }}>
						<Button
							variant='text'
							startIcon={
								<KeyboardBackspaceOutlined sx={{ fontSize: isSticky ? (isMobileSize ? '0.6rem' : '0.75rem') : undefined }} fontSize='small' />
							}
							sx={{
								'color': theme.textColor?.common.main,
								'textTransform': 'inherit',
								'fontFamily': theme.fontFamily?.main,
								':hover': {
									backgroundColor: 'transparent',
									textDecoration: 'underline',
								},
								'fontSize': isSticky ? { xs: '0.65rem', sm: '0.85rem' } : undefined,
							}}
							onClick={() => {
								if (hasAdminAccess) {
									navigate(`/admin/consultations`);
								} else {
									navigate(`/instructor/consultations`);
								}
								window.scrollTo({ top: 0, behavior: 'smooth' });
							}}>
							{isSticky ? '' : 'Consultations'}
						</Button>
						<Box sx={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', gap: '0.5rem', width: '100%' }}>
							{!isMobileSize && (
								<>
									<Tooltip title='Slots' placement='top' arrow>
										<IconButton
											size='small'
											sx={{ color: theme.textColor?.common.main }}
											onClick={() => {
												if (!consultationId) return;
												navigate(`/admin/consultation-slots/consultation/${consultationId}`);
											}}>
											<Event fontSize='small' />
										</IconButton>
									</Tooltip>
									<Tooltip title='Appointments' placement='top' arrow>
										<IconButton
											size='small'
											sx={{ color: theme.textColor?.common.main }}
											onClick={() => {
												if (!consultationId) return;
												navigate(`/admin/consultation-appointments/consultation/${consultationId}`);
											}}>
											<EventAvailable fontSize='small' />
										</IconButton>
									</Tooltip>
								</>
							)}
						</Box>
					</Box>
					{isMobileSize && (
						<Box
							sx={{
								display: 'flex',
								alignItems: 'center',
								gap: '0.25rem',
								paddingLeft: '0.25rem',
								mt: isSticky ? 0 : '0.5rem',
							}}>
							<Tooltip title='Consultation Slots' placement='top' arrow>
								<IconButton
									size='small'
									sx={{ color: theme.textColor?.common.main }}
									onClick={() => {
										if (!consultationId) return;
										navigate(`/admin/consultation-slots/consultation/${consultationId}`);
									}}>
									<Event fontSize='small' />
								</IconButton>
							</Tooltip>
							<Tooltip title='Appointments' placement='top' arrow>
								<IconButton
									size='small'
									sx={{ color: theme.textColor?.common.main }}
									onClick={() => {
										if (!consultationId) return;
										navigate(`/admin/consultation-appointments/consultation/${consultationId}`);
									}}>
									<EventAvailable fontSize='small' />
								</IconButton>
							</Tooltip>
						</Box>
					)}
				</Box>
				<Box
					sx={{
						display: 'flex',
						justifyContent: 'flex-end',
						alignItems: isSticky ? 'center' : 'flex-start',
						flex: { sm: 4, md: 2, lg: 3 },
						padding: isSticky ? '0.5rem 1rem' : '1rem',
					}}>
					<Box
						sx={{
							display: 'flex',
							flexDirection: isSticky ? 'row' : 'column',
							alignItems: 'center',
							justifyContent: isSticky ? 'flex-start' : 'space-between',
							height: '100%',
							width: '100%',
							gap: isSticky ? 1 : 0,
						}}>
						<Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', width: '100%' }}>
							<Box>
								<Typography
									variant='h6'
									sx={{
										color: theme.textColor?.common.main,
										mr: isSticky ? '0.25rem' : '0.5rem',
										fontSize: isSticky
											? singleConsultationBeforeSave?.title && singleConsultationBeforeSave?.title?.length > 40
												? { xs: '0.65rem', sm: '0.75rem' }
												: { xs: '0.7rem', sm: '0.8rem' }
											: singleConsultationBeforeSave?.title && singleConsultationBeforeSave?.title?.length > 40
												? '0.9rem'
												: '1rem',
									}}>
									{singleConsultationBeforeSave?.title}
								</Typography>
							</Box>
						</Box>
						<Box
							sx={{
								display: 'flex',
								justifyContent: 'flex-end',
								alignItems: 'center',
								width: '100%',
							}}>
							<Box sx={{ display: 'flex' }}>
								<Snackbar
									open={isMissingFieldMsgOpen}
									autoHideDuration={3000}
									anchorOrigin={{ vertical, horizontal }}
									sx={{ mt: '5rem' }}
									onClose={() => setIsMissingFieldMsgOpen(false)}>
									<Alert
										severity='error'
										variant='filled'
										sx={{ width: isMobileSize ? '60%' : '100%', fontSize: isMobileSize ? '0.75rem' : undefined }}>
										Fill in the required field(s)
									</Alert>
								</Snackbar>
								{isEditMode ? (
									<Box>
										{isSaving ? (
											<LoadingButton
												loading={isSaving}
												disabled={true}
												variant='contained'
												sx={{
													backgroundColor: 'white !important',
													textTransform: 'capitalize',
													height: isMobileSize ? '1.5rem' : '1.75rem',
													fontSize: isSticky ? (isMobileSize ? '0.6rem' : '0.75rem') : (isMobileSize ? '0.7rem' : '0.85rem'),
													mt: '0.2rem',
													'&.Mui-disabled': {
														backgroundColor: 'white !important',
													},
												}}>
												Save
											</LoadingButton>
										) : (
											<CustomSubmitButton
												unsaved={hasUnsavedChanges}
												sx={{ fontSize: isSticky ? (isMobileSize ? '0.6rem' : '0.75rem') : undefined }}
												onClick={(e) => {
													if (
														singleConsultationBeforeSave?.title.trim() !== '' &&
														singleConsultationBeforeSave?.description?.trim() !== ''
													) {
														handleConsultationUpdate(e as FormEvent<Element>);
														setHasUnsavedChanges(false);
													} else {
														setIsMissingField(true);
														setIsMissingFieldMsgOpen(true);
													}
													window.scrollTo({ top: 0, behavior: 'smooth' });
												}}>
												Save
											</CustomSubmitButton>
										)}
										<CustomCancelButton
											onClick={handleCancel}
											disabled={isSaving}
											sx={{
												color: theme.textColor?.common.main,
												borderColor: theme.textColor?.common.main,
												fontSize: isSticky ? (isMobileSize ? '0.6rem' : '0.75rem') : undefined,
											}}>
											Cancel
										</CustomCancelButton>
									</Box>
								) : (
									<Box sx={{ ml: isSticky ? '0.25rem' : '0.5rem' }}>
										{hasAdminAccess && (
											<CustomSubmitButton
												sx={{
													visibility: isEditMode ? 'hidden' : 'visible',
													padding: '0 0.75rem',
													fontSize: isSticky ? (isMobileSize ? '0.6rem' : '0.75rem') : undefined,
												}}
												onClick={handlePublishing}>
												{singleConsultationBeforeSave?.isActive ? 'Unpublish' : 'Publish'}
											</CustomSubmitButton>
										)}
										<Tooltip title='Edit Consultation' placement='top' arrow>
											<IconButton
												sx={{ padding: '0 0.75rem' }}
												onClick={() => {
													setIsEditMode(true);
												}}>
												<Edit
													sx={{
														color: 'white',
														fontSize: isSticky ? (isMobileSize ? '0.9rem' : '1rem') : undefined,
														ml: isSticky ? '-0.25rem' : '0rem',
													}}
													fontSize='small'
												/>
											</IconButton>
										</Tooltip>
										<Tooltip title='More Info' placement='top' arrow>
											<IconButton
												sx={{ padding: isSticky ? '0 0rem' : '0 0.25rem', ml: isSticky ? '-0.25rem' : '-0.5rem' }}
												onClick={() => {
													setIsConsultationInfoDialogOpen(true);
												}}>
												<Info sx={{ color: 'white', fontSize: isSticky ? (isMobileSize ? '0.9rem' : '1rem') : undefined }} fontSize='small' />
											</IconButton>
										</Tooltip>
									</Box>
								)}
							</Box>

							<ConsultationDetailsModal
								consultation={singleConsultationBeforeSave || undefined}
								isConsultationInfoDialogOpen={isConsultationInfoDialogOpen}
								setIsConsultationInfoDialogOpen={setIsConsultationInfoDialogOpen}
							/>
						</Box>
					</Box>
				</Box>
			</Box>
		</Paper>
	);
};

export default ConsultationPaper;
