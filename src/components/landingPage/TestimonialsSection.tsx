import { Box, Container, Typography, Avatar, Button } from '@mui/material';
import { motion } from 'framer-motion';
import { useState } from 'react';
import FormatQuoteIcon from '@mui/icons-material/FormatQuote';

const colorScheme = {
  primary: '#2C3E50',
  secondary: '#3498DB',
  accent: '#FF6B6B',
  cardGradient: 'linear-gradient(90deg, #4ECDC4 0%, #3498DB 100%)',
  cardShadow: '4px 4px 6px 4px rgba(0, 0, 0, 0.20)'
};

const avatarColors = ['#4ECDC4', '#FF6B6B', '#3498DB'];

const TestimonialsSection = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  
  const testimonials = [
    {
      // quote: "This platform transformed my learning experience. The courses are well-structured and engaging.",
      quote: "Bu platform öğrenme deneyimimi dönüştürdü. Kurslar çok iyi yapılandırılmış ve ilgi çekici.",
      author: "Sarah Johnson",
      role: "Software Developer",
      avatar: "/path-to-avatar1.jpg"
    },
    {
      // quote: "The community support is incredible. I've learned so much from both instructors and fellow students.",
      quote: "Topluluk desteği inanılmaz. Hem eğitmenlerden hem de diğer öğrencilerden çok şey öğrendim.",
      author: "Michael Chen",
      role: "Data Scientist",
      avatar: "/path-to-avatar2.jpg"
    },
    {
      // quote: "The flexibility to learn at my own pace while having access to expert guidance has been invaluable.",
      quote: "Kendi hızımda öğrenme esnekliği ve uzman rehberliğine erişim paha biçilemezdi.",
      author: "Emma Rodriguez",
      role: "UX Designer",
      avatar: "/path-to-avatar3.jpg"
    }
  ];

  return (
    <Box sx={{ position: 'relative', backgroundColor: '#fff' }}>
      {/* Soft shadow at the top for modern transition */}
      <Box sx={{
        width: '100%',
        height: '24px',
        boxShadow: '0 -8px 24px -8px rgba(44, 62, 80, 0.1)',
        background: 'transparent'
      }} />
      <Box sx={{ 
        py: 8, 
        backgroundColor: '#fff',
        position: 'relative'
      }}>
        <Container>
          <Typography 
            variant="h2" 
            align="center" 
            sx={{ 
              fontSize: '2.5rem',
              mb: 6,
              color: colorScheme.primary,
              fontWeight: 600,
              fontFamily: "'Plus Jakarta Sans', sans-serif"
            }}
          >
            {/* What Our Students Say */}
            Öğrencilerimiz Ne Diyor
          </Typography>
          
          <Box sx={{ 
            position: 'relative', 
            maxWidth: 800, 
            mx: 'auto',
            minHeight: '340px'
          }}>
            <motion.div
              key={activeIndex}
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ duration: 0.5 }}
            >
              <Box sx={{
                p: 4,
                backgroundColor: 'rgba(44, 62, 80, 0.02)',
                borderRadius: 3,
                textAlign: 'center',
                boxShadow: colorScheme.cardShadow,
                border: 'none',
                position: 'relative',
                overflow: 'hidden',
                '::before': {
                  content: '""',
                  display: 'block',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '7px',
                  background: colorScheme.cardGradient,
                  borderTopLeftRadius: '1rem',
                  borderTopRightRadius: '1rem',
                  zIndex: 1
                }
              }}>
                <FormatQuoteIcon sx={{
                  fontSize: 48,
                  color: colorScheme.accent,
                  opacity: 0.18,
                  position: 'absolute',
                  top: 16,
                  left: 24,
                  zIndex: 0
                }} />
                <Typography 
                  variant="h5" 
                  sx={{ 
                    mb: 3, 
                    fontStyle: 'italic',
                    color: colorScheme.primary,
                    fontWeight: 400,
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                    lineHeight: 1.6,
                    position: 'relative',
                    zIndex: 2
                  }}
                >
                  "{testimonials[activeIndex].quote}"
                </Typography>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  gap: 2,
                  mt: 2,
                  position: 'relative',
                  zIndex: 2
                }}>
                  <Avatar 
                    src={testimonials[activeIndex].avatar}
                    sx={{ 
                      width: 60, 
                      height: 60,
                      border: `2px solid ${colorScheme.secondary}`,
                      boxShadow: '0 4px 12px rgba(52, 152, 219, 0.15)',
                      background: avatarColors[activeIndex % avatarColors.length],
                      color: '#fff',
                      fontWeight: 700,
                      fontSize: 28
                    }}
                  >
                    {testimonials[activeIndex].author[0]}
                  </Avatar>
                  <Box>
                    <Typography 
                      variant="subtitle1" 
                      fontWeight={700}
                      sx={{
                        color: colorScheme.secondary,
                        fontFamily: "'Plus Jakarta Sans', sans-serif"
                      }}
                    >
                      {testimonials[activeIndex].author}
                    </Typography>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        opacity: 0.8,
                        color: colorScheme.primary,
                        fontFamily: "'Plus Jakarta Sans', sans-serif"
                      }}
                    >
                      {testimonials[activeIndex].role}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </motion.div>
            
            {/* Navigation dots */}
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'center', 
              mt: 4, 
              gap: 1 
            }}>
              {testimonials.map((_, index) => (
                <Button
                  key={index}
                  onClick={() => setActiveIndex(index)}
                  sx={{
                    minWidth: 0,
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    backgroundColor: index === activeIndex ? colorScheme.secondary : 'rgba(44, 62, 80, 0.1)',
                    p: 0,
                    '&:hover': {
                      backgroundColor: index === activeIndex ? colorScheme.accent : 'rgba(44, 62, 80, 0.2)'
                    },
                    transition: 'all 0.3s ease'
                  }}
                />
              ))}
            </Box>
          </Box>
        </Container>
      </Box>
    </Box>
  );
};

export default TestimonialsSection; 