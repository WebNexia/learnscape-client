import {
  HeadphonesRounded,
  PlayArrowRounded,
  ReplayRounded,
  StopRounded,
} from "@mui/icons-material";
import { Alert, Box, Button, Typography } from "@mui/material";
import { useEffect, useRef, useState } from "react";
import { levelTestCardSx, levelTestHeadingSx } from "./styles";

type Props = {
  audioSrc: string;
};

const ListeningPanel = ({ audioSrc }: Props) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasError, setHasError] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const stop = () => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
    setIsPlaying(false);
  };

  const play = async (restart = false) => {
    const audio = audioRef.current;
    if (!audio || !audioSrc) return;
    if (restart) audio.currentTime = 0;
    setHasError(false);
    try {
      await audio.play();
    } catch {
      setIsPlaying(false);
      setHasError(true);
    }
  };

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
    };
  }, [audioSrc]);

  return (
    <Box
      component="section"
      sx={{
        ...levelTestCardSx,
        p: { xs: 2.5, sm: 3 },
        position: { md: "sticky" },
        top: 100,
        background: "linear-gradient(145deg, #f4faff, #fff)",
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          color: "#FF6B3D",
          mb: 1,
        }}
      >
        <HeadphonesRounded />
        <Typography
          component="h3"
          sx={{ ...levelTestHeadingSx, fontSize: "1.15rem" }}
        >
          Kısa dinleme
        </Typography>
      </Box>
      <Typography sx={{ color: "#526675", lineHeight: 1.65, mb: 2 }}>
        Metin ekranda gösterilmez. İngilizce kaydı dinle; istersen tekrar
        oynatabilirsin.
      </Typography>
      {audioSrc ? (
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
          <audio
            ref={audioRef}
            src={audioSrc}
            preload="metadata"
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onEnded={() => {
              const audio = audioRef.current;
              if (audio) audio.currentTime = 0;
              setIsPlaying(false);
            }}
            onError={() => {
              setIsPlaying(false);
              setHasError(true);
            }}
          />
          <Button
            variant="contained"
            onClick={isPlaying ? stop : () => void play()}
            startIcon={isPlaying ? <StopRounded /> : <PlayArrowRounded />}
            sx={{
              borderRadius: 999,
              textTransform: "none",
              fontWeight: 700,
              bgcolor: "#0052a3",
            }}
          >
            {isPlaying ? "Durdur" : "Dinle"}
          </Button>
          <Button
            variant="outlined"
            onClick={() => void play(true)}
            startIcon={<ReplayRounded />}
            sx={{ borderRadius: 999, textTransform: "none", fontWeight: 700 }}
          >
            Tekrar dinle
          </Button>
          {hasError ? (
            <Alert severity="warning" sx={{ width: "100%" }}>
              Ses kaydı yüklenemedi. Lütfen bağlantını kontrol edip tekrar dene.
            </Alert>
          ) : null}
        </Box>
      ) : (
        <Alert severity="warning">
          Bu dinleme bölümü için ses kaydı bulunamadı.
        </Alert>
      )}
    </Box>
  );
};

export default ListeningPanel;
