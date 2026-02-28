import { Avatar, Box, DialogActions, DialogContent, Grid, Typography } from '@mui/material';
import CustomCancelButton from '../forms/customButtons/CustomCancelButton';
import { decodeHtmlEntities } from '../../utils/utilText';
import CustomDialog from '../layouts/dialog/CustomDialog';
import { dateTimeFormatter } from '../../utils/dateFormatter';
import { Consultation } from '../../interfaces/consultation';
import { useContext } from 'react';
import { MediaQueryContext } from '../../contexts/MediaQueryContextProvider';

interface ConsultationDetailsModalProps {
	consultation?: Consultation;
	isConsultationInfoDialogOpen: boolean;
	setIsConsultationInfoDialogOpen: ((isConsultationInfoDialogOpen: boolean) => void) | (() => void);
}

const ConsultationDetailsModal = ({ consultation, isConsultationInfoDialogOpen, setIsConsultationInfoDialogOpen }: ConsultationDetailsModalProps) => {
	const { isSmallScreen, isRotatedMedium } = useContext(MediaQueryContext);
	const isMobileSize = isSmallScreen || isRotatedMedium;

	// Format duration for display
	const formatDuration = (duration: number) => {
		return `${duration} min`;
	};

	// Get created by name
	const getCreatedByName = (consultation: Consultation) => {
		if (typeof consultation.createdBy === 'object' && consultation.createdBy) {
			return `${consultation.createdBy.firstName || ''} ${consultation.createdBy.lastName || ''}`.trim() || 'N/A';
		}
		return 'N/A';
	};

	// Get created by image URL
	const getCreatedByImageUrl = (consultation: Consultation) => {
		if (typeof consultation.createdBy === 'object' && consultation.createdBy) {
			return consultation.createdBy?.imageUrl || '';
		}
		return '';
	};

	// Get updated by name
	const getUpdatedByName = (consultation: Consultation) => {
		if (!consultation?.updatedBy) {
			// If updatedBy is not set, fall back to createdBy
			return getCreatedByName(consultation);
		}
		if (typeof consultation.updatedBy === 'object' && consultation.updatedBy) {
			return `${consultation.updatedBy?.firstName || ''} ${consultation.updatedBy?.lastName || ''}`.trim() || 'N/A';
		}
		return 'N/A';
	};

	// Get updated by image URL
	const getUpdatedByImageUrl = (consultation: Consultation) => {
		if (!consultation?.updatedBy) {
			// If updatedBy is not set, fall back to createdBy
			return getCreatedByImageUrl(consultation);
		}
		if (typeof consultation.updatedBy === 'object' && consultation.updatedBy) {
			return consultation.updatedBy?.imageUrl || '';
		}
		return '';
	};

	return (
		<CustomDialog
			openModal={isConsultationInfoDialogOpen}
			closeModal={() => {
				if (setIsConsultationInfoDialogOpen.length === 0) {
					(setIsConsultationInfoDialogOpen as () => void)();
				} else {
					(setIsConsultationInfoDialogOpen as (value: boolean) => void)(false);
				}
			}}
			title={consultation?.title}
			maxWidth='sm'
			titleSx={{ marginBottom: isMobileSize ? '0.25rem' : '0rem' }}>
			<DialogContent>
				<Box display='flex' flexDirection='column' gap={1}>
					<Grid container spacing={2.25}>
						<Grid item xs={3}>
							<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
								Duration:
							</Typography>
						</Grid>
						<Grid item xs={9}>
							<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
								{consultation ? formatDuration(consultation.duration) : 'N/A'}
							</Typography>
						</Grid>

						<>
							<Grid item xs={3}>
								<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
									Status:
								</Typography>
							</Grid>
							<Grid item xs={9}>
								<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
									{consultation?.isActive ? 'Active' : 'Inactive'}
								</Typography>
							</Grid>
						</>

						{consultation?.tags && consultation.tags.length > 0 && (
							<>
								<Grid item xs={3}>
									<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
										Tags:
									</Typography>
								</Grid>
								<Grid item xs={9}>
									<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
										{consultation.tags.join(', ')}
									</Typography>
								</Grid>
							</>
						)}

						<Grid item xs={3}>
							<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
								Created By:
							</Typography>
						</Grid>
						<Grid item xs={9} display='flex' alignItems='center'>
							<Avatar sx={{ width: 25, height: 25, mr: '0.5rem' }} src={consultation ? getCreatedByImageUrl(consultation) : ''} />
							<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
								{consultation ? getCreatedByName(consultation) : 'N/A'} on {consultation?.createdAt ? dateTimeFormatter(consultation.createdAt) : 'N/A'}
							</Typography>
						</Grid>

						<Grid item xs={3}>
							<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
								Last Updated By:
							</Typography>
						</Grid>
						<Grid item xs={9} display='flex' alignItems='center'>
							<Avatar sx={{ width: 25, height: 25, mr: '0.5rem' }} src={consultation ? getUpdatedByImageUrl(consultation) : ''} />
							<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
								{consultation ? getUpdatedByName(consultation) : 'N/A'} on {consultation?.updatedAt ? dateTimeFormatter(consultation.updatedAt) : 'N/A'}
							</Typography>
						</Grid>

						{consultation?.description && (
							<>
								<Grid item xs={3}>
									<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
										Description:
									</Typography>
								</Grid>
								<Grid item xs={9}>
									<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
										{decodeHtmlEntities(consultation.description)}
									</Typography>
								</Grid>
							</>
						)}
					</Grid>
				</Box>
			</DialogContent>

			<DialogActions>
				<CustomCancelButton
					onClick={() => {
						if (setIsConsultationInfoDialogOpen.length === 0) {
							(setIsConsultationInfoDialogOpen as () => void)();
						} else {
							(setIsConsultationInfoDialogOpen as (value: boolean) => void)(false);
						}
					}}
					sx={{
						margin: '0 1.5rem 0.75rem 0',
					}}>
					Cancel
				</CustomCancelButton>
			</DialogActions>
		</CustomDialog>
	);
};

export default ConsultationDetailsModal;
