import { Alert, Box, CircularProgress, Container } from "@mui/material";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import LandingPageLayout from "../components/landingPage/LandingPageLayout";
import LevelTestExperience from "../components/levelTest/LevelTestExperience";
import LevelTestParticipantGate, {
  type LevelTestParticipant,
} from "../components/levelTest/LevelTestParticipantGate";
import { SEO } from "../components/seo";

type PublicCampaign = {
  _id: string;
  name: string;
  slug: string;
  description: string;
  orgId: string;
};

const LevelTestCampaignPage = () => {
  const { slug = "" } = useParams<{ slug: string }>();
  const [campaign, setCampaign] = useState<PublicCampaign | null>(null);
  const [participant, setParticipant] = useState<LevelTestParticipant | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const baseUrl = import.meta.env.VITE_SITE_URL || "https://adenacademy.co.uk";

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    setCampaign(null);
    setParticipant(null);

    void (async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_SERVER_BASE_URL}/level-test/campaigns/public/${encodeURIComponent(slug)}`,
        );
        const payload = (await response.json().catch(() => null)) as {
          data?: PublicCampaign;
          message?: string;
        } | null;
        if (!response.ok || !payload?.data) {
          throw new Error(payload?.message || "Kampanya bulunamadı.");
        }
        if (!cancelled) setCampaign(payload.data);
      } catch (requestError) {
        if (!cancelled) {
          setError(
            requestError instanceof Error
              ? requestError.message
              : "Kampanya yüklenemedi.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [slug]);

  return (
    <>
      <SEO
        title="İngilizce Seviye Testi"
        description="Kişisel bağlantı üzerinden İngilizce seviye testi. Test sonunda PDF rapor e-posta ile gönderilir."
        keywords="İngilizce seviye testi, CEFR, Aden Academy"
        url={`${baseUrl}/level-test/c/${slug}`}
        noIndex
      />
      <LandingPageLayout>
        <Box
          component="main"
          sx={{
            minHeight: "72vh",
            background:
              "radial-gradient(circle at 20% 20%, rgba(0, 82, 163, 0.1), transparent 38%), linear-gradient(180deg, #ffffff 0%, #f5f9fc 100%)",
            px: 2,
            pt: { xs: 9, sm: 10, md: 12 },
            pb: { xs: 5, md: 8 },
          }}
        >
          <Container maxWidth="lg">
            {loading ? (
              <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
                <CircularProgress />
              </Box>
            ) : error ? (
              <Alert severity="error">{error}</Alert>
            ) : !campaign ? (
              <Alert severity="error">Kampanya bulunamadı.</Alert>
            ) : !participant ? (
              <LevelTestParticipantGate
                campaignDescription={campaign.description}
                onSubmit={setParticipant}
              />
            ) : (
              <LevelTestExperience
                mode="tracked"
                campaignSlug={campaign.slug}
                participant={participant}
              />
            )}
          </Container>
        </Box>
      </LandingPageLayout>
    </>
  );
};

export default LevelTestCampaignPage;
