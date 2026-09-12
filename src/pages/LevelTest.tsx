import { Box, Container } from "@mui/material";
import LandingPageLayout from "../components/landingPage/LandingPageLayout";
import LevelTestExperience from "../components/levelTest/LevelTestExperience";
import { SEO } from "../components/seo";

const LevelTest = () => {
  const baseUrl = import.meta.env.VITE_SITE_URL || "https://adenacademy.co.uk";

  return (
    <>
      <SEO
        title="Ücretsiz İngilizce Seviye Testi (A1–C2)"
        description="Kısa okuma ve dinleme bölümlerinden oluşan ücretsiz uyarlanabilir İngilizce seviye testiyle tahmini CEFR seviyeni öğren."
        keywords="İngilizce seviye testi, online seviye testi, CEFR, A1 C2, okuma testi, dinleme testi, Aden Academy"
        url={`${baseUrl}/seviye-testi`}
      />
      <LandingPageLayout>
        <Box
          component="main"
          sx={{
            minHeight: "72vh",
            background:
              "radial-gradient(circle at 20% 20%, rgba(0, 82, 163, 0.1), transparent 38%), linear-gradient(180deg, #ffffff 0%, #f5f9fc 100%)",
            px: 2,
            py: { xs: 5, md: 8 },
          }}
        >
          <Container maxWidth="lg">
            <LevelTestExperience />
          </Container>
        </Box>
      </LandingPageLayout>
    </>
  );
};

export default LevelTest;
