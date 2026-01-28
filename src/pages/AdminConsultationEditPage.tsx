import { Box, DialogContent, Typography, Grid, FormControlLabel, Checkbox, Tooltip, MenuItem, Select, SelectChangeEvent, FormControl, Snackbar, Alert } from '@mui/material';
import DashboardPagesLayout from '../components/layouts/dashboardLayout/DashboardPagesLayout';
import { FormEvent, useContext, useEffect, useState } from 'react';
import { useParams, useBlocker, useNavigate } from 'react-router-dom';
import axios from '@utils/axiosInstance';
import { ConsultationsContext } from '../contexts/ConsultationsContextProvider';
import { Consultation, ConsultationPrice } from '../interfaces/consultation';
import CustomTextField from '../components/forms/customFields/CustomTextField';
import CustomSubmitButton from '../components/forms/customButtons/CustomSubmitButton';
import ConsultationPaper from '../components/adminSingleConsultation/ConsultationPaper';
import CustomDialog from '../components/layouts/dialog/CustomDialog';
import CustomDialogActions from '../components/layouts/dialog/CustomDialogActions';
import theme from '../themes';
import { MediaQueryContext } from '../contexts/MediaQueryContextProvider';
import { useStickyPaper } from '../hooks/useStickyPaper';
import { validateImageUrl } from '../utils/urlValidation';
import HandleImageUploadURL from '../components/forms/uploadImageVideoDocument/HandleImageUploadURL';
import useImageUpload from '../hooks/useImageUpload';
import ConsultationDetailsNonEditBox from '../components/adminSingleConsultation/ConsultationDetailsNonEditBox';

const AdminConsultationEditPage = () => {
	const { consultationId } = useParams();
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;
	const navigate = useNavigate();

	const { updateConsultation } = useContext(ConsultationsContext);

	const { isSmallScreen, isRotatedMedium } = useContext(MediaQueryContext);
	const isMobileSize = isSmallScreen || isRotatedMedium;

	const { isSticky } = useStickyPaper(isMobileSize);
	const { resetImageUpload } = useImageUpload();
	const [enterImageUrl, setEnterImageUrl] = useState<boolean>(true);

	const [isEditMode, setIsEditMode] = useState<boolean>(true);
	const [singleConsultation, setSingleConsultation] = useState<Consultation>();
	const [singleConsultationBeforeSave, setSingleConsultationBeforeSave] = useState<Consultation>();
	const [isFree, setIsFree] = useState<boolean>(false);
	const [isMissingFieldMsgOpen, setIsMissingFieldMsgOpen] = useState<boolean>(false);
	const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);

	const [isPopStateNavigation, setIsPopStateNavigation] = useState(false);
	const [isUrlErrorOpen, setIsUrlErrorOpen] = useState<boolean>(false);
	const [urlErrorMessage, setUrlErrorMessage] = useState<string>('');
	const [isSaving, setIsSaving] = useState<boolean>(false);
	const [isSuccessSnackbarOpen, setIsSuccessSnackbarOpen] = useState<boolean>(false);

	// Price states
	const [GBP, setGBP] = useState<ConsultationPrice>({ currency: 'gbp', amount: '' });
	const [USD, setUSD] = useState<ConsultationPrice>({ currency: 'usd', amount: '' });
	const [EUR, setEUR] = useState<ConsultationPrice>({ currency: 'eur', amount: '' });
	const [TRY, setTRY] = useState<ConsultationPrice>({ currency: 'try', amount: '' });

	// Tags state
	const [tags, setTags] = useState<string[]>([]);
	const [tagInput, setTagInput] = useState<string>('');


	const [allowNavigation, setAllowNavigation] = useState(false);
	const [nextLocation, setNextLocation] = useState<string | null>(null);
	const [pendingTx, setPendingTx] = useState<any>(null);

	useEffect(() => {
		const handlePopState = () => {
			setIsPopStateNavigation(true);
		};
		window.addEventListener('popstate', handlePopState);

		return () => {
			window.removeEventListener('popstate', handlePopState);
		};
	}, []);

	// Warn on browser/tab close or refresh
	useEffect(() => {
		const handleBeforeUnload = (e: BeforeUnloadEvent) => {
			if (hasUnsavedChanges) {
				e.preventDefault();
				e.returnValue = '';
			}
		};
		window.addEventListener('beforeunload', handleBeforeUnload);
		return () => window.removeEventListener('beforeunload', handleBeforeUnload);
	}, [hasUnsavedChanges]);

	// Warn on in-app navigation (Data Router only) with custom dialog
	useBlocker((tx) => {
		if (allowNavigation || isPopStateNavigation) {
			return false; // Allow navigation
		}
		if (hasUnsavedChanges) {
			setPendingTx(tx);
			setNextLocation(tx.nextLocation.pathname);
			return true; // Block navigation
		}
		return false;
	});

	useEffect(() => {
		if (allowNavigation && nextLocation) {
			navigate(nextLocation);
			setAllowNavigation(false);
			setNextLocation(null);
		}
		// Reset popstate flag after transition completes
		if (isPopStateNavigation) {
			setIsPopStateNavigation(false);
		}
	}, [allowNavigation, nextLocation, navigate, isPopStateNavigation]);

	useEffect(() => {
		if (consultationId) {
			const fetchSingleConsultationData = async (consultationId: string): Promise<void> => {
				try {
					const response = await axios.get(`${base_url}/consultations/${consultationId}`);

					const consultationResponse = response?.data?.data;
					setSingleConsultation(consultationResponse);
					setSingleConsultationBeforeSave(consultationResponse);

					// Check if consultation is free
					if (consultationResponse?.prices?.some((price: ConsultationPrice) => price.amount === 'Free' || price.amount === '' || price.amount === '0')) {
						setIsFree(true);
					}

					// Set price states
					const gbpPrice = consultationResponse?.prices?.find((p: ConsultationPrice) => p.currency === 'gbp') || { currency: 'gbp', amount: '' };
					const usdPrice = consultationResponse?.prices?.find((p: ConsultationPrice) => p.currency === 'usd') || { currency: 'usd', amount: '' };
					const eurPrice = consultationResponse?.prices?.find((p: ConsultationPrice) => p.currency === 'eur') || { currency: 'eur', amount: '' };
					const tryPrice = consultationResponse?.prices?.find((p: ConsultationPrice) => p.currency === 'try') || { currency: 'try', amount: '' };

					setGBP(gbpPrice);
					setUSD(usdPrice);
					setEUR(eurPrice);
					setTRY(tryPrice);

					// Set tags
					setTags(consultationResponse?.tags || []);
				} catch (error) {
					console.log(error);
				}
			};
			fetchSingleConsultationData(consultationId);
		}
	}, [consultationId]);

	const handlePublishing = async (): Promise<void> => {
		if (consultationId !== undefined) {
			try {
				await axios.patch(`${base_url}/consultations/${consultationId}/toggle-status`, {});
				setSingleConsultation((prevData) => {
					if (prevData) {
						return {
							...prevData,
							isActive: !singleConsultationBeforeSave?.isActive,
						};
					}
					return prevData;
				});
				setSingleConsultationBeforeSave((prevData) => {
					if (prevData) {
						return {
							...prevData,
							isActive: !singleConsultationBeforeSave?.isActive,
						};
					}
					return prevData;
				});
				updateConsultation({
					...singleConsultationBeforeSave!,
					isActive: !singleConsultationBeforeSave?.isActive,
				});
			} catch (error) {
				console.log(error);
			}
		}
	};

	const handleConsultationUpdate = async (e: FormEvent): Promise<void> => {
		e.preventDefault();

		// Check if there are unsaved changes
		if (!hasUnsavedChanges) {
			setIsEditMode(false);
			return;
		}

		// Validate image URL before proceeding
		if (singleConsultationBeforeSave?.coverImageUrl?.trim()) {
			const imageValidation = await validateImageUrl(singleConsultationBeforeSave.coverImageUrl.trim());
			if (!imageValidation.isValid) {
				setUrlErrorMessage('Invalid image URL format');
				setIsUrlErrorOpen(true);
				return;
			}
		}

		setIsSaving(true);

		try {
			// Prepare prices array - always send all 4 currencies
			const prices: ConsultationPrice[] = isFree
				? [
					{ currency: 'gbp', amount: '' },
					{ currency: 'usd', amount: '' },
					{ currency: 'eur', amount: '' },
					{ currency: 'try', amount: '' },
				]
				: [GBP, USD, EUR, TRY];

			if (!singleConsultationBeforeSave) {
				return;
			}

			const updatedConsultation = {
				...singleConsultationBeforeSave,
				title: singleConsultationBeforeSave.title?.trim() || '',
				description: singleConsultationBeforeSave.description?.trim() || '',
				duration: singleConsultationBeforeSave.duration || 30,
				prices,
				coverImageUrl: singleConsultationBeforeSave.coverImageUrl?.trim() || '',
				tags: tags.filter((tag) => tag.trim() !== ''),
			};

			const response = await axios.patch(`${base_url}/consultations/${consultationId}`, updatedConsultation);

			const responseUpdatedData = response.data.data;

			const finalConsultation: Consultation = {
				...singleConsultationBeforeSave,
				title: updatedConsultation.title || singleConsultationBeforeSave.title || '',
				description: updatedConsultation.description || singleConsultationBeforeSave.description || '',
				duration: updatedConsultation.duration,
				prices: updatedConsultation.prices,
				coverImageUrl: updatedConsultation.coverImageUrl,
				tags: updatedConsultation.tags,
				updatedAt: responseUpdatedData.updatedAt,
				updatedBy: responseUpdatedData.updatedBy,
			};

			setSingleConsultationBeforeSave(finalConsultation);
			updateConsultation(finalConsultation);
			setSingleConsultation(finalConsultation);

			setHasUnsavedChanges(false);
			setIsEditMode(false);
			setIsSuccessSnackbarOpen(true);
			setSingleConsultation(finalConsultation);
			window.scrollTo({ top: 0, behavior: 'smooth' });
		} catch (error) {
			console.error('Error updating consultation:', error);
		} finally {
			setIsSaving(false);
		}
	};

	const addTag = () => {
		if (tagInput.trim() && tags.length < 3 && !tags.includes(tagInput.trim())) {
			setTags([...tags, tagInput.trim()]);
			setTagInput('');
			setHasUnsavedChanges(true);
		}
	};

	const removeTag = (tagToRemove: string) => {
		setTags(tags.filter((tag) => tag !== tagToRemove));
		setHasUnsavedChanges(true);
	};

	const sectionSx = {
		backgroundColor: theme.bgColor?.common,
		borderRadius: '0.75rem',
		padding: isMobileSize ? '1rem' : '1.25rem',
		border: `1px solid ${theme.palette.divider}`,
		boxShadow: '0 10px 30px rgba(15, 23, 42, 0.08)',
	};

	return (
		<DashboardPagesLayout pageName='Edit Consultation' customSettings={{ justifyContent: 'flex-start' }} showCopyRight={true}>
			<Box sx={{ width: '80%', position: 'fixed', top: '4rem', zIndex: 1000, backgroundColor: theme.bgColor?.secondary }}>
				<ConsultationPaper
					singleConsultation={singleConsultation}
					singleConsultationBeforeSave={singleConsultationBeforeSave}
					isEditMode={isEditMode}
					isMissingFieldMsgOpen={isMissingFieldMsgOpen}
					setIsEditMode={setIsEditMode}
					setIsMissingFieldMsgOpen={setIsMissingFieldMsgOpen}
					setIsMissingField={() => { }}
					handlePublishing={handlePublishing}
					handleConsultationUpdate={handleConsultationUpdate}
					hasUnsavedChanges={hasUnsavedChanges}
					setHasUnsavedChanges={setHasUnsavedChanges}
					setSingleConsultationBeforeSave={setSingleConsultationBeforeSave}
					isSaving={isSaving}
				/>
			</Box>

			<Box sx={{ display: 'flex', width: '95%', justifyContent: 'center', marginTop: isSticky && isMobileSize ? '3.5rem' : '9rem' }}>
				{!isEditMode && (
					<ConsultationDetailsNonEditBox singleConsultation={singleConsultationBeforeSave} />
				)}

				{isEditMode && (
					<Box
						sx={{
							display: 'flex',
							flexDirection: 'column',
							justifyContent: 'flex-start',
							width: '95%',
						}}>
						<form onSubmit={handleConsultationUpdate}>
							{/* Cover Image */}
							<Box sx={{ ...sectionSx, mt: '1rem' }}>
								<Typography variant='h6' sx={{ fontSize: isMobileSize ? '0.9rem' : '1rem', mb: '1rem' }}>
									Cover Image
								</Typography>
								<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%' }}>
									<Box sx={{ flex: 3 }}>
										<HandleImageUploadURL
											label=''
											onImageUploadLogic={(url) => {
												if (singleConsultationBeforeSave) {
													setSingleConsultationBeforeSave({
														...singleConsultationBeforeSave,
														coverImageUrl: url,
													});
													setHasUnsavedChanges(true);
												}
											}}
											onChangeImgUrl={(e) => {
												if (singleConsultationBeforeSave) {
													setSingleConsultationBeforeSave({
														...singleConsultationBeforeSave,
														coverImageUrl: e.target.value,
													});
													setHasUnsavedChanges(true);
												}
											}}
											imageUrlValue={singleConsultationBeforeSave?.coverImageUrl || ''}
											imageFolderName='ConsultationImages'
											enterImageUrl={enterImageUrl}
											setEnterImageUrl={setEnterImageUrl}
										/>
									</Box>
									<Box
										sx={{
											display: 'flex',
											flexDirection: 'column',
											alignItems: 'flex-end',
											mt: '1.5rem',
											padding: '0 0 0 2rem',
											flex: 1,
										}}>
										<Box sx={{ textAlign: 'center' }}>
											<img
												src={singleConsultationBeforeSave?.coverImageUrl || 'https://placehold.co/500x400/e2e8f0/64748b?text=No+Image'}
												alt='consultation_img'
												height={isMobileSize ? 85 : 115}
												style={{
													borderRadius: '0.2rem',
													boxShadow: '0 0.1rem 0.4rem 0.2rem rgba(0,0,0,0.3)',
												}}
											/>
											<Box>
												<Typography variant='body2' sx={{ mt: '0.25rem' }}>
													Cover Image
												</Typography>
												{singleConsultationBeforeSave?.coverImageUrl && (
													<Typography
														variant='body2'
														sx={{ fontSize: '0.75rem', textDecoration: 'underline', cursor: 'pointer' }}
														onClick={() => {
															setSingleConsultationBeforeSave((prevData) => {
																if (prevData !== undefined) {
																	return {
																		...prevData,
																		coverImageUrl: '',
																	};
																}
															});
															resetImageUpload();
															setHasUnsavedChanges(true);
														}}>
														Remove
													</Typography>
												)}
											</Box>
										</Box>
									</Box>
								</Box>
							</Box>
							{/* Consultation Details */}
							<Box sx={{ ...sectionSx, mt: '2rem' }}>
								<Typography variant='h6' sx={{ fontSize: isMobileSize ? '0.9rem' : '1rem', mb: '1rem' }}>
									Consultation Details
								</Typography>

								<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: '1rem', gap: '2rem' }}>
									<Box sx={{ flex: 1, mr: isMobileSize ? '0rem' : '2rem' }}>
										<Typography variant='h6' sx={{ fontSize: isMobileSize ? '0.85rem' : '0.9rem' }}>
											Title*
										</Typography>
										<Tooltip title='Max 100 Characters' placement='top' arrow>
											<CustomTextField
												sx={{
													marginTop: '0.5rem',
												}}
												value={singleConsultationBeforeSave?.title || ''}
												InputProps={{ inputProps: { maxLength: 75 } }}
												placeholder='Enter title'
												onChange={(e) => {
													setHasUnsavedChanges(true);
													setSingleConsultationBeforeSave((prev) => {
														if (prev) {
															return { ...prev, title: e.target.value };
														}
														return prev;
													});
												}}
											/>
										</Tooltip>
										<Typography sx={{ fontSize: isMobileSize ? '0.65rem' : '0.7rem', textAlign: 'right' }}>
											{(singleConsultationBeforeSave?.title || '').length}/75 Characters
										</Typography>
									</Box>
									<Box sx={{ flex: 1 }}>
										<Typography variant='h6' sx={{ fontSize: isMobileSize ? '0.85rem' : '0.9rem', marginBottom: '0.5rem' }}>
											Description*
										</Typography>
										<CustomTextField
											fullWidth
											multiline
											rows={6}
											value={singleConsultationBeforeSave?.description || ''}
											onChange={(e) => {
												setHasUnsavedChanges(true);
												setSingleConsultationBeforeSave((prev) => {
													if (prev) {
														return { ...prev, description: e.target.value };
													}
													return prev;
												});
											}}
											required
											InputProps={{
												inputProps: {
													maxLength: 150,
												},
											}}
										/>
										<Typography sx={{ fontSize: isMobileSize ? '0.65rem' : '0.7rem', textAlign: 'right' }}>
											{(singleConsultationBeforeSave?.description || '').length}/150 Characters
										</Typography>
									</Box>

								</Box>

								<Box sx={{ flex: 1, textAlign: 'left' }}>
									<FormControl>
										<Typography variant='h6' sx={{ fontSize: isMobileSize ? '0.85rem' : '0.9rem' }}>
											Duration (minutes)
										</Typography>
										<Select
											value={singleConsultationBeforeSave?.duration?.toString() || '30'}
											onChange={(e: SelectChangeEvent) => {
												setHasUnsavedChanges(true);
												setSingleConsultationBeforeSave((prev) => {
													if (prev) {
														return { ...prev, duration: parseInt(e.target.value, 10) };
													}
													return prev;
												});
											}}
											size='small'
											required
											sx={{ backgroundColor: theme.bgColor?.common, fontSize: isMobileSize ? '0.75rem' : '0.85rem', mt: '0.5rem' }}>
											<MenuItem value='30' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.8rem' }}>
												30
											</MenuItem>
											<MenuItem value='45' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.8rem' }}>
												45
											</MenuItem>
											<MenuItem value='60' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.8rem' }}>
												60
											</MenuItem>
											<MenuItem value='75' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.8rem' }}>
												75
											</MenuItem>
											<MenuItem value='90' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.8rem' }}>
												90
											</MenuItem>
										</Select>
									</FormControl>
								</Box>
							</Box>



							<Box sx={{ display: 'flex', gap: '1rem', mb: '4rem' }}>
								{/* Prices */}
								<Box sx={{ ...sectionSx, mt: '2rem', flex: 1 }}>
									<Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
										<Typography variant='h6' sx={{ fontSize: isMobileSize ? '0.9rem' : '1rem' }}>
											Prices
										</Typography>
										<Tooltip title='Check to make this consultation free in all currencies.' placement='top' arrow>
											<FormControlLabel
												control={
													<Checkbox
														checked={isFree}
														onChange={(e) => {
															setIsFree(e.target.checked);
															setHasUnsavedChanges(true);
															if (e.target.checked) {
																setGBP({ currency: 'gbp', amount: '' });
																setUSD({ currency: 'usd', amount: '' });
																setEUR({ currency: 'eur', amount: '' });
																setTRY({ currency: 'try', amount: '' });
															}
														}}
														sx={{
															'& .MuiSvgIcon-root': {
																fontSize: isMobileSize ? '0.9rem' : '1rem',
															},
														}}
													/>
												}
												label='Free Consultation'
												sx={{
													'mr': '0rem',
													'& .MuiFormControlLabel-label': {
														fontSize: isMobileSize ? '0.65rem' : '0.75rem',
													},
												}}
											/>
										</Tooltip>
									</Box>
									<Grid container spacing={2}>
										<Grid item xs={6}>
											<CustomTextField
												label='GBP'
												value={isFree ? '' : GBP.amount}
												onChange={(e) => {
													const value = e.target.value;
													if (value === '' || parseFloat(value) >= 0) {
														setGBP({ currency: 'gbp', amount: String(value) });
														setHasUnsavedChanges(true);
													}
												}}
												type='number'
												required={!isFree}
												disabled={isFree}
												sx={{ backgroundColor: isFree ? 'transparent' : '#fff' }}
												InputLabelProps={{
													sx: { fontSize: '0.8rem' },
												}}
												InputProps={{
													inputProps: { min: 0 },
												}}
											/>
										</Grid>
										<Grid item xs={6}>
											<CustomTextField
												label='USD'
												value={isFree ? '' : USD.amount}
												onChange={(e) => {
													const value = e.target.value;
													if (value === '' || parseFloat(value) >= 0) {
														setUSD({ currency: 'usd', amount: String(value) });
														setHasUnsavedChanges(true);
													}
												}}
												type='number'
												required={!isFree}
												disabled={isFree}
												sx={{ backgroundColor: isFree ? 'transparent' : '#fff' }}
												InputLabelProps={{
													sx: { fontSize: '0.8rem' },
												}}
												InputProps={{
													inputProps: { min: 0 },
												}}
											/>
										</Grid>
										<Grid item xs={6}>
											<CustomTextField
												label='EUR'
												value={isFree ? '' : EUR.amount}
												onChange={(e) => {
													const value = e.target.value;
													if (value === '' || parseFloat(value) >= 0) {
														setEUR({ currency: 'eur', amount: String(value) });
														setHasUnsavedChanges(true);
													}
												}}
												type='number'
												required={!isFree}
												disabled={isFree}
												sx={{ backgroundColor: isFree ? 'transparent' : '#fff' }}
												InputLabelProps={{
													sx: { fontSize: '0.8rem' },
												}}
												InputProps={{
													inputProps: { min: 0 },
												}}
											/>
										</Grid>
										<Grid item xs={6}>
											<CustomTextField
												label='TRY'
												value={isFree ? '' : TRY.amount}
												onChange={(e) => {
													const value = e.target.value;
													if (value === '' || parseFloat(value) >= 0) {
														setTRY({ currency: 'try', amount: String(value) });
														setHasUnsavedChanges(true);
													}
												}}
												type='number'
												required={!isFree}
												disabled={isFree}
												sx={{ backgroundColor: isFree ? 'transparent' : '#fff' }}
												InputLabelProps={{
													sx: { fontSize: '0.8rem' },
												}}
												InputProps={{
													inputProps: { min: 0 },
												}}
											/>
										</Grid>
									</Grid>
								</Box>

								{/* Tags */}
								<Box sx={{ ...sectionSx, mt: '2rem', flex: 1 }}>
									<Typography variant='h6' sx={{ fontSize: isMobileSize ? '0.9rem' : '1rem', mb: '1rem' }}>
										Tags (Max 3)
									</Typography>
									<Box sx={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
										{tags.map((tag, index) => (
											<Box
												key={index}
												sx={{
													display: 'inline-flex',
													alignItems: 'center',
													padding: '0.25rem 0.75rem',
													backgroundColor: theme.palette.primary.main,
													color: 'white',
													borderRadius: '1rem',
													fontSize: isMobileSize ? '0.7rem' : '0.8rem',
													fontFamily: theme.fontFamily?.main,
												}}>
												{tag}
												<Box
													component='span'
													onClick={() => removeTag(tag)}
													sx={{
														marginLeft: '0.5rem',
														cursor: 'pointer',
														'&:hover': { opacity: 0.7 },
													}}>
													×
												</Box>
											</Box>
										))}
									</Box>
									<Box sx={{ display: 'flex', gap: '0.5rem' }}>
										<CustomTextField
											value={tagInput}
											onChange={(e) => setTagInput(e.target.value)}
											onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
												if (e.key === 'Enter') {
													e.preventDefault();
													addTag();
												}
											}}
											placeholder={tags.length >= 3 ? 'Maximum 3 tags reached' : 'Add tag'}
											disabled={tags.length >= 3}
											sx={{ flex: 1 }}
										/>
										<CustomSubmitButton
											type='button'
											onClick={addTag}
											disabled={!tagInput.trim() || tags.length >= 3 || tags.includes(tagInput.trim())}>
											Add Tag
										</CustomSubmitButton>
									</Box>
								</Box>
							</Box>

						</form>
					</Box>
				)}
			</Box>


			{/* CustomDialog for unsaved changes confirmation */}
			<CustomDialog openModal={!!pendingTx} closeModal={() => setPendingTx(null)} title='Unsaved Changes' maxWidth='sm'>
				<DialogContent>
					<Typography variant='body2'>You have unsaved changes. Are you sure you want to leave this page?</Typography>
					<Typography variant='body2' sx={{ mt: '0.75rem' }}>
						If you leave this page, you will lose your unsaved changes.
					</Typography>
				</DialogContent>
				<CustomDialogActions
					onCancel={() => setPendingTx(null)}
					onSubmit={() => {
						if (nextLocation) {
							setAllowNavigation(true);
							setPendingTx(null);
						}
					}}
					submitBtnText='Leave Page'
					cancelBtnText='Stay'
					actionSx={{ margin: '0 0.5rem 0.5rem 0' }}
				/>
			</CustomDialog>

			{/* URL validation error SnackBar */}
			<Snackbar
				open={isUrlErrorOpen}
				autoHideDuration={3500}
				anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
				onClose={() => setIsUrlErrorOpen(false)}>
				<Alert severity='error' variant='filled' sx={{ width: '100%' }}>
					{urlErrorMessage}
				</Alert>
			</Snackbar>

			{/* Success SnackBar */}
			<Snackbar
				open={isSuccessSnackbarOpen}
				autoHideDuration={4000}
				anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
				onClose={() => setIsSuccessSnackbarOpen(false)}>
				<Alert severity='success' variant='filled' sx={{ width: '100%', color: '#fff' }}>
					Consultation updated successfully
				</Alert>
			</Snackbar>
		</DashboardPagesLayout>
	);
};

export default AdminConsultationEditPage;
