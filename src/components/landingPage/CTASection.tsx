import { Box, Button, Container, Typography } from '@mui/material';
import { motion } from 'framer-motion';

const colorScheme = {
  primary: '#2C3E50',
  secondary: '#3498DB',
  accent: '#FDF7F0',
  text: '#34495E'
};

const CTASection = () => {
  return (
    <Box sx={{ position: 'relative', backgroundColor: 'rgba(44, 62, 80, 0.02)' }}>
      {/* Soft shadow at the top for modern transition */}
      <Box sx={{
        width: '100%',
        height: '24px',
        boxShadow: '0 -8px 24px -8px rgba(44, 62, 80, 0.1)',
        background: 'transparent'
      }} />
      <Container>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <Box sx={{
            textAlign: 'center',
            maxWidth: 800,
            mx: 'auto',
            py: 8
          }}>
            <Typography 
              variant="h2" 
              sx={{ 
                mb: 3,
                color: colorScheme.text,
                fontWeight: 600,
                fontFamily: "'Plus Jakarta Sans', sans-serif"
              }}
            >
              {/* Ready to Start Your Learning Journey? */}
              Öğrenme Yolculuğunuza Başlamaya Hazır mısınız?
            </Typography>
            <Typography 
              variant="h5" 
              sx={{ 
                mb: 4,
                color: colorScheme.text,
                opacity: 0.8,
                fontWeight: 400,
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                lineHeight: 1.6
              }}
            >
              {/* Join thousands of students who are already transforming their lives through education */}
              Eğitim yoluyla hayatlarını değiştiren binlerce öğrenciye katılın
            </Typography>
            <Box sx={{ 
              display: 'flex', 
              gap: 2, 
              justifyContent: 'center',
              flexWrap: 'wrap'
            }}>
              <Button 
                variant="contained" 
                size="large"
                sx={{ 
                  backgroundColor: colorScheme.primary,
                  color: '#fff',
                  px: 4,
                  py: 1.5,
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  fontWeight: 400,
                  '&:hover': { 
                    backgroundColor: colorScheme.secondary,
                    transform: 'translateY(-2px)',
                    boxShadow: '0 4px 12px rgba(44, 62, 80, 0.1)'
                  },
                  transition: 'all 0.3s ease',
                  borderRadius: '1.1rem'
                }}
              >
                {/* Get Started Now */}
                Hemen Başla
              </Button>
              <Button 
                variant="outlined" 
                size="large"
                sx={{ 
                  borderColor: colorScheme.primary,
                  color: colorScheme.primary,
                  px: 4,
                  py: 1.5,
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  fontWeight: 400,
                  '&:hover': { 
                    borderColor: colorScheme.secondary,
                    color: colorScheme.secondary,
                    backgroundColor: 'rgba(44, 62, 80, 0.05)',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 4px 12px rgba(44, 62, 80, 0.1)'
                  },
                  transition: 'all 0.3s ease',
                  borderRadius: '1.1rem'
                }}
              >
                {/* View Courses */}
                Kursları Görüntüle
              </Button>
            </Box>
          </Box>
        </motion.div>
      </Container>
    </Box>
  );
};

export default CTASection; 