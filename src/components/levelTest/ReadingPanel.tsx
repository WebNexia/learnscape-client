import { MenuBookRounded } from "@mui/icons-material";
import { Box, Typography } from "@mui/material";
import { levelTestCardSx, levelTestHeadingSx } from "./styles";

const ReadingPanel = ({ paragraphs }: { paragraphs: string[] }) => (
  <Box
    component="section"
    sx={{
      ...levelTestCardSx,
      p: { xs: 2.5, sm: 3 },
      position: { md: "sticky" },
      top: 150,
      maxHeight: { md: "calc(100vh - 130px)" },
      overflowY: "auto",
      mt: { xs: 2, sm: 3 }
    }}
  >
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1,
        color: "#0052a3",
        mb: 1.5,
      }}
    >
      <MenuBookRounded />
      <Typography
        component="h3"
        sx={{ ...levelTestHeadingSx, fontSize: { xs: "1rem", sm: "1.15rem" } }}
      >
        Okuma metni
      </Typography>
    </Box>
    <Box lang="en">
      {paragraphs.map((paragraph) => (
        <Typography
          key={paragraph}
          component="p"
          sx={{
            color: "#263f49",
            fontSize: { xs: "0.9rem", sm: "0.95rem" },
            lineHeight: 1.85,
            mb: 2,
          }}
        >
          {paragraph}
        </Typography>
      ))}
    </Box>
  </Box>
);

export default ReadingPanel;
