import { Box, Button, Typography } from "@mui/material";
import { useState } from "react";
import CustomTextField from "../forms/customFields/CustomTextField";
import { levelTestCardSx, levelTestHeadingSx, primaryButtonSx } from "./styles";

export type LevelTestParticipant = {
  name: string;
  email: string;
  phone: string;
};

type Props = {
  campaignDescription?: string;
  onSubmit: (participant: LevelTestParticipant) => void;
};

const LevelTestParticipantGate = ({
  campaignDescription,
  onSubmit,
}: Props) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");

  const submit = () => {
    const cleanName = name.trim().replace(/\s+/g, " ");
    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = phone.trim();
    if (cleanName.length < 2) {
      setError("Lütfen adını yaz.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setError("Geçerli bir e-posta adresi yaz.");
      return;
    }
    if (cleanPhone.length < 7) {
      setError("Geçerli bir telefon numarası yaz.");
      return;
    }
    setError("");
    onSubmit({ name: cleanName, email: cleanEmail, phone: cleanPhone });
  };

  return (
    <Box
      component="section"
      sx={{
        ...levelTestCardSx,
        p: { xs: 3, sm: 4 },
        maxWidth: 560,
        mx: "auto",
      }}
    >
      <Typography
        component="h1"
        sx={{ ...levelTestHeadingSx, fontSize: { xs: "1.15rem", sm: "1.5rem" } }}
      >
        İngilizce Seviye Testi
      </Typography>
      <Typography sx={{ color: "#526675", mt: 1.25, mb: 2.5, lineHeight: 1.65, fontSize: { xs: "0.8rem", sm: "1rem" } }}>
        {campaignDescription?.trim()
          ? campaignDescription
          : "Test bitiminde raporunuz e-posta adresinize PDF olarak gönderilecektir."}
      </Typography>
      <Box
        component="form"
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
        sx={{ display: "grid", gap: 0.5 }}
      >
        <CustomTextField
          label="Ad Soyad"
          value={name}
          onChange={(event) => setName(event.target.value)}
          InputProps={{ inputProps: { maxLength: 80 } }}
          required
        />
        <CustomTextField
          type="email"
          label="E-posta"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          InputProps={{ inputProps: { maxLength: 254 } }}
          required
        />
        <CustomTextField
          label="Telefon"
          placeholder="WhatsApp numaranızı giriniz"
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          InputProps={{ inputProps: { maxLength: 40 } }}
          required
        />
        {error ? (
          <Typography sx={{ color: "#b91c1c", fontSize: "0.9rem", mt: 0.5 }}>
            {error}
          </Typography>
        ) : null}
        <Button type="submit" variant="contained" sx={{ ...primaryButtonSx, mt: 2 }}>
          Teste Başla
        </Button>
      </Box>
    </Box>
  );
};

export default LevelTestParticipantGate;
