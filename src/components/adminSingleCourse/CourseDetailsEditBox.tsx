import { Box, Checkbox, FormControlLabel, Tooltip, Typography } from '@mui/material';
import CustomTextField from '../forms/customFields/CustomTextField';
import CustomErrorMessage from '../forms/customFields/CustomErrorMessage';
import { SingleCourse } from '../../interfaces/course';
import theme from '../../themes';
import { useContext, useEffect, useState } from 'react';
import HandleImageUploadURL from '../forms/uploadImageVideoDocument/HandleImageUploadURL';
import useImageUpload from '../../hooks/useImageUpload';
import { Roles } from '../../interfaces/enums';
import { UserAuthContext } from '../../contexts/UserAuthContextProvider';
import { MediaQueryContext } from '../../contexts/MediaQueryContextProvider';
import { useAuth } from '../../hooks/useAuth';

interface CourseDetailsEditBoxProps {
	singleCourseBeforeSave?: SingleCourse;
	isFree: boolean;
	isMissingField: boolean;
	setSingleCourseBeforeSave: React.Dispatch<React.SetStateAction<SingleCourse | undefined>>;
	setIsMissingField: React.Dispatch<React.SetStateAction<boolean>>;
	setIsFree: React.Dispatch<React.SetStateAction<boolean>>;
	setHasUnsavedChanges: React.Dispatch<React.SetStateAction<boolean>>;
}

const CourseDetailsEditBox = ({
	singleCourseBeforeSave,
	isFree,
	isMissingField,
	setIsFree,
	setIsMissingField,
	setSingleCourseBeforeSave,
	setHasUnsavedChanges,
}: CourseDetailsEditBoxProps) => {
	const [enterImageUrl, setEnterImageUrl] = useState<boolean>(true);

	const { user } = useContext(UserAuthContext);
	const { hasAdminAccess } = useAuth();
	const { isSmallScreen, isRotatedMedium } = useContext(MediaQueryContext);
	const isMobileSize = isSmallScreen || isRotatedMedium;

	const { resetImageUpload } = useImageUpload();

	const [GBP, setGBP] = useState<string>('');
	const [USD, setUSD] = useState<string>('');
	const [EUR, setEUR] = useState<string>('');
	const [TRY, setTRY] = useState<string>('');

	useEffect(() => {
		// Initialize price states from `singleCourse.prices`
		if (singleCourseBeforeSave) {
			setGBP(singleCourseBeforeSave.prices?.find((price) => price.currency === 'gbp')?.amount || '');
			setUSD(singleCourseBeforeSave.prices?.find((price) => price.currency === 'usd')?.amount || '');
			setEUR(singleCourseBeforeSave.prices?.find((price) => price.currency === 'eur')?.amount || '');
			setTRY(singleCourseBeforeSave.prices?.find((price) => price.currency === 'try')?.amount || '');
		}
	}, [singleCourseBeforeSave]);

	const updatePriceInSingleCourse = (currency: 'gbp' | 'usd' | 'eur' | 'try', amount: string) => {
		setSingleCourseBeforeSave((prevCourse) => {
			if (prevCourse) {
				const prices = [...prevCourse.prices];
				const index = prices.findIndex((price) => price.currency === currency);

				if (index > -1) {
					// Update existing currency price
					prices[index] = { ...prices[index], amount };
				} else {
					// Add new currency price
					prices.push({ currency, amount });
				}

				return { ...prevCourse, prices };
			}
			return prevCourse;
		});
	};

	const formatDate = (date: Date) => {
		if (!(date instanceof Date)) return ''; // Return empty string if date is not valid

		const day = String(date.getDate()).padStart(2, '0');
		const month = String(date.getMonth() + 1).padStart(2, '0');
		const year = date.getFullYear();

		return `${year}-${month}-${day}`;
	};

	const parseDate = (dateString: string) => {
		const [year, month, day] = dateString.split('-');
		return new Date(`${year}-${month}-${day}`);
	};
	return (
		<>
			<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%' }}>
				<Box sx={{ flex: 3 }}>
					<HandleImageUploadURL
						label='Cover Image'
						onImageUploadLogic={(url) => {
							if (singleCourseBeforeSave) {
								setSingleCourseBeforeSave({
									...singleCourseBeforeSave,
									imageUrl: url,
								});
								setHasUnsavedChanges(true);
							}
						}}
						onChangeImgUrl={(e) => {
							if (singleCourseBeforeSave) {
								setSingleCourseBeforeSave({
									...singleCourseBeforeSave,
									imageUrl: e.target.value,
								});
								setHasUnsavedChanges(true);
							}
						}}
						imageUrlValue={singleCourseBeforeSave?.imageUrl || ''}
						imageFolderName='CourseImages'
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
						padding: '0 0 2rem 2rem',
						flex: 1,
					}}>
					<Box sx={{ textAlign: 'center' }}>
						<img
							src={singleCourseBeforeSave?.imageUrl || 'https://placehold.co/500x400/e2e8f0/64748b?text=No+Image'}
							alt='course_img'
							height={isMobileSize ? '85rem' : '115rem'}
							style={{
								borderRadius: '0.2rem',
								boxShadow: '0 0.1rem 0.4rem 0.2rem rgba(0,0,0,0.3)',
							}}
						/>
						<Box>
							<Typography variant='body2' sx={{ mt: '0.25rem' }}>
								Cover Image
							</Typography>
							{singleCourseBeforeSave?.imageUrl && (
								<Typography
									variant='body2'
									sx={{ fontSize: '0.75rem', textDecoration: 'underline', cursor: 'pointer' }}
									onClick={() => {
										setSingleCourseBeforeSave((prevData) => {
											if (prevData !== undefined) {
												return {
													...prevData,
													imageUrl: '',
												};
											}
										});

										resetImageUpload();
									}}>
									Remove
								</Typography>
							)}
						</Box>
					</Box>
				</Box>
			</Box>
			<Box
				sx={{
					display: 'flex',
					flexDirection: isMobileSize ? 'column' : 'row',
					justifyContent: 'space-between',
					mt: isMobileSize ? '-1rem' : '-1.75rem',
					width: '100%',
				}}>
				<Box sx={{ display: 'flex', width: isMobileSize ? '100%' : '80%' }}>
					<Box sx={{ flex: 1 }}>
						<Typography variant='h6' sx={{ fontSize: isMobileSize ? '0.85rem' : '0.9rem' }}>
							Title*
						</Typography>

						<CustomTextField
							sx={{
								marginTop: '0.5rem',
								backgroundColor: theme.bgColor?.common,
							}}
							multiline
							value={singleCourseBeforeSave?.title}
							onChange={(e) => {
								setSingleCourseBeforeSave((prevData) => {
									if (prevData) {
										return { ...prevData, title: e.target.value };
									}
									return prevData;
								});
								setIsMissingField(false);
								setHasUnsavedChanges(true);
							}}
							InputProps={{ inputProps: { maxLength: 50 } }}
							error={isMissingField && singleCourseBeforeSave?.title === ''}
						/>
						<Typography sx={{ fontSize: isMobileSize ? '0.65rem' : '0.7rem', margin: '-0.25rem 0 0.5rem 0rem', textAlign: 'right' }}>
							{singleCourseBeforeSave?.title?.length}/50 Characters
						</Typography>

						{isMissingField && singleCourseBeforeSave?.title === '' && <CustomErrorMessage>Enter a title</CustomErrorMessage>}
					</Box>
					<Box sx={{ flex: 1.5, marginLeft: isMobileSize ? '1rem' : '2rem' }}>
						<Typography variant='h6' sx={{ fontSize: isMobileSize ? '0.85rem' : '0.9rem' }}>
							Description*
						</Typography>

						<CustomTextField
							sx={{ marginTop: '0.5rem' }}
							value={singleCourseBeforeSave?.description}
							onChange={(e) => {
								setSingleCourseBeforeSave((prevData) => {
									if (prevData) {
										return { ...prevData, description: e.target.value };
									}
									return prevData;
								});
								setIsMissingField(false);
								setHasUnsavedChanges(true);
							}}
							multiline
							InputProps={{ inputProps: { maxLength: 500 } }}
							error={isMissingField && singleCourseBeforeSave?.description === ''}
						/>
						<Typography
							sx={{
								fontSize: isMobileSize ? '0.65rem' : '0.7rem',
								margin: '-0.25rem 0 0.5rem 0rem',
								textAlign: 'right',
							}}>
							{singleCourseBeforeSave?.description?.length}/500 Characters
						</Typography>

						{isMissingField && singleCourseBeforeSave?.description === '' && <CustomErrorMessage>Enter a description</CustomErrorMessage>}
					</Box>
				</Box>
				<Box sx={{ alignItems: 'center', ml: isMobileSize ? '0rem' : '2rem', display: hasAdminAccess ? 'flex' : 'none' }}>
					<Tooltip title='External courses will be managed outside the platform.' placement='top' arrow>
						<FormControlLabel
							control={
								<Checkbox
									checked={singleCourseBeforeSave?.courseManagement?.isExternal}
									onChange={(e) => {
										setSingleCourseBeforeSave((prevData) => {
											if (prevData) {
												return {
													...prevData,
													courseManagement: { ...prevData.courseManagement, isExternal: e.target.checked },
												};
											}
											return prevData;
										});
										setHasUnsavedChanges(true);
									}}
									sx={{
										'& .MuiSvgIcon-root': {
											fontSize: isMobileSize ? '1rem' : '1.25rem',
										},
									}}
								/>
							}
							label='External Course'
							sx={{
								'& .MuiFormControlLabel-label': {
									fontSize: isMobileSize ? '0.75rem' : '0.85rem',
								},
							}}
						/>
					</Tooltip>
				</Box>
			</Box>

			<Box
				sx={{
					display: 'flex',
					flexDirection: isMobileSize ? 'column' : 'row',
					justifyContent: 'space-between',
					alignItems: 'flex-start',
					mt: '1.5rem',
				}}>
				<Box sx={{ flex: 1, zIndex: 1, display: hasAdminAccess ? undefined : 'none' }}>
					<Typography variant='h6' sx={{ fontSize: isMobileSize ? '0.85rem' : '0.9rem' }}>
						Prices
					</Typography>
					<Box sx={{ display: 'flex', alignItems: 'center' }}>
						<Box
							sx={{
								display: 'flex',
								flexDirection: 'column',
								justifyContent: 'flex-start',
								flex: 1,
							}}>
							<CustomTextField
								label='GBP'
								sx={{ margin: '0.5rem 0 0.5rem 0rem', backgroundColor: !isFree ? theme.bgColor?.common : 'inherit' }}
								value={isFree ? '' : GBP}
								onChange={(e) => {
									setGBP(e.target.value);
									updatePriceInSingleCourse('gbp', e.target.value);
									setIsMissingField(false);
									setHasUnsavedChanges(true);
								}}
								type='number'
								disabled={isFree}
								error={!isFree && GBP === ''}
							/>
							<CustomTextField
								label='USD'
								sx={{ margin: '0.5rem 0 0 0rem', backgroundColor: !isFree ? theme.bgColor?.common : 'inherit' }}
								value={isFree ? '' : USD}
								onChange={(e) => {
									setUSD(e.target.value);
									updatePriceInSingleCourse('usd', e.target.value);
									setIsMissingField(false);
									setHasUnsavedChanges(true);
								}}
								type='number'
								disabled={isFree}
								error={!isFree && USD === ''}
							/>
						</Box>
						<Box sx={{ flex: 1, ml: '1rem' }}>
							<CustomTextField
								label='EUR'
								sx={{ margin: '0.5rem 0 0.5rem 0rem', backgroundColor: !isFree ? theme.bgColor?.common : 'inherit' }}
								value={isFree ? '' : EUR}
								onChange={(e) => {
									setEUR(e.target.value);
									updatePriceInSingleCourse('eur', e.target.value);
									setIsMissingField(false);
									setHasUnsavedChanges(true);
								}}
								type='number'
								disabled={isFree}
								error={!isFree && EUR === ''}
							/>
							<CustomTextField
								label='TRY'
								sx={{ margin: '0.5rem 0 0 0rem', backgroundColor: !isFree ? theme.bgColor?.common : 'inherit' }}
								value={isFree ? '' : TRY}
								onChange={(e) => {
									setTRY(e.target.value);
									updatePriceInSingleCourse('try', e.target.value);
									setIsMissingField(false);
									setHasUnsavedChanges(true);
								}}
								type='number'
								disabled={isFree}
								error={!isFree && TRY === ''}
							/>
						</Box>
					</Box>
					<Box sx={{ margin: '0 0 1rem 0rem' }}>
						<FormControlLabel
							control={
								<Checkbox
									checked={isFree}
									onChange={(e) => {
										setIsFree(e.target.checked);
										if (e.target.checked) {
											// Clear prices for a free course
											setGBP('');
											setUSD('');
											setEUR('');
											setTRY('');
											setSingleCourseBeforeSave((prevCourse) =>
												prevCourse
													? {
															...prevCourse,
															prices: [
																{ amount: '', currency: 'gbp' },
																{ amount: '', currency: 'usd' },
																{ amount: '', currency: 'eur' },
																{ amount: '', currency: 'try' },
															],
														}
													: prevCourse
											);
											setIsMissingField(false);
											setHasUnsavedChanges(true);
										}
									}}
									sx={{
										'& .MuiSvgIcon-root': {
											fontSize: isMobileSize ? '1rem' : '1.25rem',
										},
									}}
								/>
							}
							label='Free Course'
							sx={{
								'& .MuiFormControlLabel-label': {
									fontSize: isMobileSize ? '0.75rem' : '0.85rem',
								},
							}}
						/>
					</Box>
					{isMissingField && singleCourseBeforeSave?.prices?.some((price) => price.amount === '') && (
						<CustomErrorMessage>Enter price amount</CustomErrorMessage>
					)}
				</Box>

				<Box sx={{ display: 'flex', flexDirection: isMobileSize ? 'column' : 'row' }}>
					<Box sx={{ display: 'flex' }}>
						<Box sx={{ display: 'flex', marginLeft: hasAdminAccess ? (isMobileSize ? '0rem' : '4rem') : '0', flex: 1 }}>
							<Box sx={{ flex: 2 }}>
								<Typography variant='h6' sx={{ fontSize: isMobileSize ? '0.85rem' : '0.9rem' }}>
									Weeks
								</Typography>
								<CustomTextField
									required={false}
									sx={{ marginTop: '0.5rem' }}
									value={singleCourseBeforeSave?.durationWeeks ?? ''}
									onChange={(e) => {
										if (singleCourseBeforeSave) {
											setSingleCourseBeforeSave({
												...singleCourseBeforeSave,
												durationWeeks: +e.target.value,
											});
											setHasUnsavedChanges(true);
										}
									}}
									type='number'
									placeholder='# of weeks'
								/>
							</Box>
							<Box sx={{ ml: '0.5rem', flex: 3 }}>
								<Typography variant='h6' sx={{ fontSize: isMobileSize ? '0.85rem' : '0.9rem' }}>
									Hours
								</Typography>
								<CustomTextField
									required={false}
									sx={{ marginTop: '0.5rem' }}
									value={singleCourseBeforeSave?.durationHours ?? ''}
									onChange={(e) => {
										if (singleCourseBeforeSave) {
											setSingleCourseBeforeSave({
												...singleCourseBeforeSave,
												durationHours: +e.target.value,
											});
											setHasUnsavedChanges(true);
										}
									}}
									type='number'
									placeholder='# of hours'
								/>
							</Box>
						</Box>
						<Box sx={{ marginLeft: '4rem', flex: 1 }}>
							<Typography variant='h6' sx={{ fontSize: isMobileSize ? '0.85rem' : '0.9rem' }}>
								Starting Date
							</Typography>
							<CustomTextField
								required={false}
								sx={{ marginTop: '0.5rem' }}
								value={
									singleCourseBeforeSave && singleCourseBeforeSave.startingDate
										? formatDate(new Date(singleCourseBeforeSave.startingDate)) // Format the starting date
										: ''
								}
								onChange={(e) => {
									const selectedDate = parseDate(e.target.value);
									if (singleCourseBeforeSave) {
										setSingleCourseBeforeSave({
											...singleCourseBeforeSave,
											startingDate: selectedDate,
										});
										setHasUnsavedChanges(true);
									}
								}}
								type='date'
							/>
						</Box>
					</Box>
					<Box sx={{ display: !hasAdminAccess ? 'flex' : 'none', flex: 1, justifyContent: 'flex-end', width: '100%' }}>
						<Tooltip title='External courses will be managed outside the platform.' placement='top' arrow>
							<FormControlLabel
								labelPlacement='start'
								control={
									<Checkbox
										checked={singleCourseBeforeSave?.courseManagement?.isExternal}
										onChange={(e) => {
											setSingleCourseBeforeSave((prevData) => {
												if (prevData) {
													return {
														...prevData,
														courseManagement: { ...prevData.courseManagement, isExternal: e.target.checked },
													};
												}
												return prevData;
											});
											setHasUnsavedChanges(true);
										}}
										sx={{
											'& .MuiSvgIcon-root': {
												fontSize: isMobileSize ? '1rem' : '1.25rem',
											},
										}}
									/>
								}
								label='External Course'
								sx={{
									'& .MuiFormControlLabel-label': {
										fontSize: isMobileSize ? '0.75rem' : '0.85rem',
									},
								}}
							/>
						</Tooltip>
					</Box>
				</Box>
			</Box>
		</>
	);
};

export default CourseDetailsEditBox;
