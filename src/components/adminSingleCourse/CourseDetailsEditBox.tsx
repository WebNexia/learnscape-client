import { Box, Checkbox, FormControlLabel, Tooltip, Typography } from '@mui/material';
import CustomTextField from '../forms/customFields/CustomTextField';
import CustomErrorMessage from '../forms/customFields/CustomErrorMessage';
import { SingleCourse } from '../../interfaces/course';
import theme from '../../themes';
import { useEffect, useState } from 'react';
import HandleImageUploadURL from '../forms/uploadImageVideoDocument/HandleImageUploadURL';
import useImageUpload from '../../hooks/useImageUpload';

interface CourseDetailsEditBoxProps {
	singleCourse?: SingleCourse;
	isFree: boolean;
	isMissingField: boolean;
	setSingleCourse: React.Dispatch<React.SetStateAction<SingleCourse | undefined>>;
	setIsMissingField: React.Dispatch<React.SetStateAction<boolean>>;
	setIsFree: React.Dispatch<React.SetStateAction<boolean>>;
}

const CourseDetailsEditBox = ({ singleCourse, isFree, isMissingField, setIsFree, setIsMissingField, setSingleCourse }: CourseDetailsEditBoxProps) => {
	const [enterImageUrl, setEnterImageUrl] = useState<boolean>(true);

	const { resetImageUpload } = useImageUpload();

	const [GBP, setGBP] = useState<string>('');
	const [USD, setUSD] = useState<string>('');
	const [EUR, setEUR] = useState<string>('');
	const [TRY, setTRY] = useState<string>('');

	useEffect(() => {
		// Initialize price states from `singleCourse.prices`
		if (singleCourse) {
			setGBP(singleCourse.prices.find((price) => price.currency === 'gbp')?.amount || '');
			setUSD(singleCourse.prices.find((price) => price.currency === 'usd')?.amount || '');
			setEUR(singleCourse.prices.find((price) => price.currency === 'eur')?.amount || '');
			setTRY(singleCourse.prices.find((price) => price.currency === 'try')?.amount || '');
		}
	}, [singleCourse]);

	const updatePriceInSingleCourse = (currency: 'gbp' | 'usd' | 'eur' | 'try', amount: string) => {
		setSingleCourse((prevCourse) => {
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
							if (singleCourse) {
								setSingleCourse({
									...singleCourse,
									imageUrl: url,
								});
							}
						}}
						onChangeImgUrl={(e) => {
							if (singleCourse) {
								setSingleCourse({
									...singleCourse,
									imageUrl: e.target.value,
								});
							}
						}}
						imageUrlValue={singleCourse?.imageUrl || ''}
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
							src={singleCourse?.imageUrl || 'https://directmobilityonline.co.uk/assets/img/noimage.png'}
							alt='course_img'
							height='115rem'
							style={{
								borderRadius: '0.2rem',
								boxShadow: '0 0.1rem 0.4rem 0.2rem rgba(0,0,0,0.3)',
							}}
						/>
						<Box>
							<Typography variant='body2' sx={{ mt: '0.25rem' }}>
								Cover Image
							</Typography>
							{singleCourse?.imageUrl && (
								<Typography
									variant='body2'
									sx={{ fontSize: '0.75rem', textDecoration: 'underline', cursor: 'pointer' }}
									onClick={() => {
										setSingleCourse((prevData) => {
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
			<Box sx={{ display: 'flex', justifyContent: 'space-between', mt: '-1.75rem' }}>
				<Box sx={{ flex: 1 }}>
					<Typography variant='h6'>Title*</Typography>
					<Tooltip title='Max 50 Characters' placement='top'>
						<CustomTextField
							sx={{
								marginTop: '0.5rem',
								backgroundColor: theme.bgColor?.common,
							}}
							multiline
							value={singleCourse?.title}
							onChange={(e) => {
								setSingleCourse(() => {
									if (singleCourse?.title !== undefined) {
										return { ...singleCourse, title: e.target.value };
									}
								});
								setIsMissingField(false);
							}}
							InputProps={{ inputProps: { maxLength: 50 } }}
							error={isMissingField && singleCourse?.title === ''}
						/>
					</Tooltip>
					{isMissingField && singleCourse?.title === '' && <CustomErrorMessage>Enter a title</CustomErrorMessage>}
				</Box>
				<Box sx={{ flex: 1.5, marginLeft: '2rem' }}>
					<Typography variant='h6'>Description*</Typography>
					<Tooltip title='Max 500 characters' placement='top'>
						<CustomTextField
							sx={{ marginTop: '0.5rem' }}
							value={singleCourse?.description}
							onChange={(e) => {
								setSingleCourse(() => {
									if (singleCourse?.description !== undefined) {
										return { ...singleCourse, description: e.target.value };
									}
								});
								setIsMissingField(false);
							}}
							multiline
							InputProps={{ inputProps: { maxLength: 500 } }}
							error={isMissingField && singleCourse?.description === ''}
						/>
					</Tooltip>

					{isMissingField && singleCourse?.description === '' && <CustomErrorMessage>Enter a description</CustomErrorMessage>}
				</Box>
				<Box sx={{ display: 'flex', alignItems: 'center', ml: '2rem' }}>
					<Tooltip title='This course will be managed outside the platform.' placement='top'>
						<FormControlLabel
							control={
								<Checkbox
									checked={singleCourse?.courseManagement?.isExternal}
									onChange={(e) => {
										setSingleCourse(() => {
											if (singleCourse?.courseManagement !== undefined) {
												return { ...singleCourse, courseManagement: { ...singleCourse.courseManagement, isExternal: e.target.checked } };
											}
										});
									}}
									sx={{
										'& .MuiSvgIcon-root': {
											fontSize: '1.25rem',
										},
									}}
								/>
							}
							label='External Course'
							sx={{
								'& .MuiFormControlLabel-label': {
									fontSize: '0.85rem',
								},
							}}
						/>
					</Tooltip>
				</Box>
			</Box>

			<Box
				sx={{
					display: 'flex',
					justifyContent: 'space-between',
					alignItems: 'flex-start',
					mt: '1.5rem',
				}}>
				<Box sx={{ flex: 1, zIndex: 1 }}>
					<Typography variant='h6'>Prices</Typography>
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
								}}
								type='number'
								disabled={isFree}
								error={!isFree && TRY === ''}
							/>
						</Box>
					</Box>
					<Box sx={{ margin: '0 0 1rem 0.5rem' }}>
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
											setSingleCourse((prevCourse) =>
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
										}
									}}
									sx={{
										'& .MuiSvgIcon-root': {
											fontSize: '1.25rem',
										},
									}}
								/>
							}
							label='Free Course'
							sx={{
								'& .MuiFormControlLabel-label': {
									fontSize: '0.85rem',
								},
							}}
						/>
					</Box>
					{isMissingField && singleCourse?.prices.some((price) => price.amount === '') && <CustomErrorMessage>Enter price amount</CustomErrorMessage>}
				</Box>
				<Box sx={{ display: 'flex', marginLeft: '4rem', flex: 1 }}>
					<Box sx={{ flex: 2 }}>
						<Typography variant='h6'>Weeks</Typography>
						<CustomTextField
							required={false}
							sx={{ marginTop: '0.5rem' }}
							value={singleCourse?.durationWeeks ?? ''}
							onChange={(e) => {
								if (singleCourse?.durationWeeks !== undefined) {
									setSingleCourse({
										...singleCourse,
										durationWeeks: +e.target.value,
									});
								}
							}}
							type='number'
							placeholder='# of weeks'
						/>
					</Box>
					<Box sx={{ ml: '0.5rem', flex: 3 }}>
						<Typography variant='h6'>Hours</Typography>
						<CustomTextField
							required={false}
							sx={{ marginTop: '0.5rem' }}
							value={singleCourse?.durationHours ?? ''}
							onChange={(e) => {
								if (singleCourse) {
									if (singleCourse?.durationHours !== undefined) {
										setSingleCourse({
											...singleCourse,
											durationHours: +e.target.value,
										});
									}
								}
							}}
							type='number'
							placeholder='# of hours'
						/>
					</Box>
				</Box>
				<Box sx={{ marginLeft: '4rem', flex: 1 }}>
					<Typography variant='h6'>Starting Date</Typography>
					<CustomTextField
						required={false}
						sx={{ marginTop: '0.5rem' }}
						value={
							singleCourse && singleCourse.startingDate
								? formatDate(new Date(singleCourse.startingDate)) // Format the starting date
								: ''
						}
						onChange={(e) => {
							const selectedDate = parseDate(e.target.value); // Parse the input date
							if (singleCourse && singleCourse.startingDate !== undefined) {
								setSingleCourse({
									...singleCourse,
									startingDate: selectedDate, // Assign parsed date object here
								});
							}
						}}
						type='date'
					/>
				</Box>
			</Box>
		</>
	);
};

export default CourseDetailsEditBox;
