import { Box, Checkbox, FormControlLabel, Typography } from '@mui/material';
import CustomTextField from '../forms/customFields/CustomTextField';
import CustomErrorMessage from '../forms/customFields/CustomErrorMessage';
import { SingleCourse } from '../../interfaces/course';
import theme from '../../themes';
import { useContext, useState } from 'react';
import HandleImageUploadURL from '../forms/uploadImageVideo/HandleImageUploadURL';
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
			<Box sx={{ mt: '2rem' }}>
				<Typography variant='h4'>Title*</Typography>
				<CustomTextField
					sx={{
						marginTop: '0.5rem',
						backgroundColor: theme.bgColor?.common,
					}}
					value={singleCourse?.title}
					onChange={(e) => {
						setSingleCourse(() => {
							if (singleCourse?.title !== undefined) {
								return { ...singleCourse, title: e.target.value };
							}
						});
						setIsMissingField(false);
					}}
					error={isMissingField && singleCourse?.title === ''}
				/>
				{isMissingField && singleCourse?.title === '' && <CustomErrorMessage>Please enter a title</CustomErrorMessage>}
			</Box>
			<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mt: '2rem', width: '100%' }}>
				<Box sx={{ flex: 3 }}>
					<Typography variant='h4'>Description*</Typography>
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
						error={isMissingField && singleCourse?.description === ''}
					/>
					{isMissingField && singleCourse?.description === '' && <CustomErrorMessage>Please enter a description</CustomErrorMessage>}
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
								Course Image
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

			<Box
				sx={{
					display: 'flex',
					justifyContent: 'space-between',
					alignItems: 'flex-start',
				}}>
				<Box sx={{ mt: '2rem', flex: 6 }}>
					<Typography variant='h4'>Price*</Typography>
					<Box sx={{ display: 'flex' }}>
						<Box sx={{ flex: 2 }}>
							<CustomTextField
								sx={{
									marginTop: '0.5rem',
									backgroundColor: !isFree ? theme.bgColor?.common : 'inherit',
								}}
								value={isFree ? '' : singleCourse?.priceCurrency}
								onChange={(e) => {
									if (singleCourse?.priceCurrency !== undefined) {
										setSingleCourse({
											...singleCourse,
											priceCurrency: isFree ? '' : e.target.value,
										});
									}
									setIsMissingField(false);
								}}
								disabled={isFree}
								error={isMissingField && singleCourse?.priceCurrency === ''}
								placeholder={isFree ? '' : 'Enter currency symbol'}
							/>
							{isMissingField && singleCourse?.priceCurrency === '' && !isFree && <CustomErrorMessage>Please enter a currency</CustomErrorMessage>}
						</Box>
						<Box
							sx={{
								display: 'flex',
								flexDirection: 'column',
								justifyContent: 'flex-start',
								flex: 3,
							}}>
							<CustomTextField
								sx={{
									margin: '0.5rem 0 0 0.5rem',
									backgroundColor: !isFree ? theme.bgColor?.common : 'inherit',
								}}
								value={isFree ? '' : singleCourse?.price}
								onChange={(e) => {
									if (singleCourse?.price !== undefined) {
										setSingleCourse({
											...singleCourse,
											price: isFree ? 'Free' : e.target.value,
										});
									}
									setIsMissingField(false);
								}}
								type='number'
								disabled={isFree}
								error={isMissingField && singleCourse?.price === ''}
								placeholder={isFree ? '' : 'Enter price value'}
							/>
							{isMissingField && singleCourse?.price === '' && <CustomErrorMessage>Please enter a price value</CustomErrorMessage>}
						</Box>
					</Box>
					<Box sx={{ margin: '1rem' }}>
						<FormControlLabel
							control={
								<Checkbox
									checked={isFree}
									onChange={(e) => {
										setIsFree(e.target.checked);
										if (singleCourse?.price !== undefined && singleCourse?.priceCurrency !== undefined) {
											setSingleCourse({
												...singleCourse!,
												priceCurrency: '',
												price: e.target.checked ? 'Free' : '',
											});
										}
										if (e.target.checked) {
											setIsMissingField(false);
										}
									}}
								/>
							}
							label='Free Course'
						/>
					</Box>
				</Box>

				<Box sx={{ margin: '2rem 0 0 6rem', flex: 10 }}>
					<HandleImageUploadURL
						onImageUploadLogic={(url) => {
							if (singleCourse?.imageUrl !== undefined) {
								setSingleCourse({
									...singleCourse,
									imageUrl: url,
								});
							}
						}}
						onChangeImgUrl={(e) => {
							setSingleCourse(() => {
								if (singleCourse?.imageUrl !== undefined) {
									return { ...singleCourse, imageUrl: e.target.value };
								}
							});
						}}
						imageUrlValue={singleCourse?.imageUrl}
						imageFolderName='CourseImages'
						enterImageUrl={enterImageUrl}
						setEnterImageUrl={setEnterImageUrl}
					/>
				</Box>
			</Box>

			<Box
				sx={{
					display: 'flex',
					justifyContent: 'space-between',
					alignItems: 'flex-start',
				}}>
				<Box sx={{ display: 'flex', mt: '2rem', flex: 6 }}>
					<Box sx={{ flex: 2 }}>
						<Typography variant='h4'>Weeks</Typography>
						<CustomTextField
							required={false}
							sx={{ marginTop: '0.5rem' }}
							value={singleCourse?.durationWeeks || ''}
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
						<Typography variant='h4'>Hours</Typography>
						<CustomTextField
							required={false}
							sx={{ marginTop: '0.5rem' }}
							value={singleCourse?.durationHours || ''}
							onChange={(e) => {
								if (singleCourse?.durationHours !== undefined) {
									setSingleCourse({
										...singleCourse,
										durationHours: +e.target.value,
									});
								}
							}}
							type='number'
							placeholder='# of hours'
						/>
					</Box>
				</Box>
				<Box sx={{ margin: '2rem 0 0 6rem', flex: 10 }}>
					<Typography variant='h4'>Starting Date</Typography>
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
