import { Box, Chip, DialogActions, DialogContent, Typography } from '@mui/material';
import CustomCancelButton from '../../components/forms/customButtons/CustomCancelButton';
import CustomDialog from '../../components/layouts/dialog/CustomDialog';

const DIALOG_BG = 'linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(255, 255, 255, 0.98))';
const DIALOG_BORDERRADIUS = '1.5rem';
const DIALOG_BOXSHADOW = '0 0.5rem 2rem rgba(44, 62, 80, 0.1)';
const DIALOG_BORDER = '0.5rem solid rgba(255, 255, 255, 0.18)';
const DIALOG_FONT = 'Varela Round';

interface LandingPageCoursesInfoDialogProps {
	isInfoDialogOpen: boolean;
	setIsInfoDialogOpen: (isInfoDialogOpen: boolean) => void;
}

const LandingPageCoursesInfoDialog = ({ isInfoDialogOpen, setIsInfoDialogOpen }: LandingPageCoursesInfoDialogProps) => {
	return (
		<CustomDialog
			openModal={isInfoDialogOpen}
			closeModal={() => setIsInfoDialogOpen(false)}
			maxWidth='sm'
			title='Kurslar Hakkında Bilgi'
			titleSx={{ fontSize: '1.5rem', fontWeight: 600, fontFamily: DIALOG_FONT, color: '#2C3E50', ml: '0.5rem', textAlign: 'center', mb: 1 }}
			PaperProps={{
				sx: {
					height: 'auto',
					maxHeight: '90vh',
					overflow: 'visible',
					borderRadius: DIALOG_BORDERRADIUS,
					background: DIALOG_BG,
					boxShadow: DIALOG_BOXSHADOW,
					backdropFilter: 'blur(8px)',
					border: DIALOG_BORDER,
					fontFamily: DIALOG_FONT,
				},
			}}>
			<DialogContent>
				<Box sx={{ p: 1, pt: 2 }}>
					<Typography sx={{ mb: '2rem', mt: '-1rem', fontFamily: DIALOG_FONT, fontSize: { xs: '0.85rem', sm: '1rem' }, color: 'text.secondary' }}>
						Sitemizde iki tür kurs bulunmaktadır. Her kurs türü farklı bir deneyim sunar:
					</Typography>
					<Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: 'center', mb: '2rem' }}>
						<Chip
							label='Platform Kursu'
							color='success'
							size='small'
							sx={{ fontFamily: DIALOG_FONT, fontWeight: 500, mr: 2, minWidth: '7.5rem', mb: { xs: 2, sm: 0 }, color: '#fff' }}
						/>
						<Typography sx={{ fontFamily: DIALOG_FONT, fontSize: { xs: '0.85rem', sm: '0.9rem' }, color: 'text.primary' }}>
							Tüm eğitim materyalleri ve yönetim hizmetleri platformumuz aracılığıyla sunulur. Giriş yaptıktan sonra kurslarınıza kolayca
							ulaşabilirsiniz.
						</Typography>
					</Box>
					<Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: 'center' }}>
						<Chip
							label='Partner Kursu'
							color='info'
							size='small'
							sx={{ fontFamily: DIALOG_FONT, fontWeight: 500, mr: 2, minWidth: '7.5rem', mb: { xs: 2, sm: 0 } }}
						/>
						<Typography sx={{ fontFamily: DIALOG_FONT, fontSize: { xs: '0.85rem', sm: '0.9rem' }, color: 'text.primary' }}>
							Bu kurslar iş birliği yaptığımız eğitmenler tarafından sunulur. Kayıt işlemleri sayfamız üzerinden gerçekleştirilir; ancak derslerin
							sunumu ve içerik yönetimi, eğitmenlerin tercih ettiği platform ve yöntemlerle yapılır.
						</Typography>
					</Box>
				</Box>
			</DialogContent>
			<DialogActions sx={{ mt: '-1rem' }}>
				<CustomCancelButton onClick={() => setIsInfoDialogOpen(false)} sx={{ fontFamily: DIALOG_FONT, margin: '0 1rem 1rem 0' }}>
					Kapat
				</CustomCancelButton>
			</DialogActions>
		</CustomDialog>
	);
};

export default LandingPageCoursesInfoDialog;
