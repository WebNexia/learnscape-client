import {
  AppBar,
  Box,
  Button,
  IconButton,
  Toolbar,
  Typography,
  Badge,
} from "@mui/material";
import theme from "../../themes";
import { useLocation, useNavigate } from "react-router-dom";
import { useContext, useState, useEffect, useMemo } from "react";
import { MediaQueryContext } from "../../contexts/MediaQueryContextProvider";
import { useDocumentCart } from "../../contexts/DocumentCartContextProvider";
import { useConsultationCart } from "../../contexts/ConsultationCartContextProvider";
import logo from "../../assets/logo.png";
import {
  Menu,
  ShoppingCart,
  SchoolOutlined,
  MenuBookOutlined,
  GroupsOutlined,
  MailOutline,
  InfoOutlined,
} from "@mui/icons-material";
import LandingPageDrawer from "../landingPage/LandingPageDrawer";

/** Aden blues — same endpoints as `LandingPageDrawer` ADEN_BLUE_GRADIENT, plus a deeper anchor for hover */
const ADEN_BLUE_DEEP = "#002952";
const ADEN_BLUE = "#004c99";
const ADEN_BLUE_BRIGHT = "#0052a3";

const Header = () => {
  const {
    isVerySmallScreen,
    isSmallScreen,
    isRotated,
    isRotatedMedium,
    isMobileLandscape,
    isMobilePortrait,
    isTabletPortrait,
  } = useContext(MediaQueryContext);
  const isMobileSize = isSmallScreen || isRotatedMedium;
  const isMobileSizeSmall = isVerySmallScreen || isRotated;
  const navigate = useNavigate();
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [isScrolled, setIsScrolled] = useState<boolean>(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
  const { count: documentCartCount } = useDocumentCart();
  const { count: consultationCartCount } = useConsultationCart();
  const cartCount = documentCartCount + consultationCartCount;
  const navItems = useMemo(() => {
    const items: Array<{
      label: string;
      action: () => void;
      isActive?: boolean;
      NavIcon?: typeof SchoolOutlined;
    }> = [
      {
        label: "Ana Sayfa",
        action: () => {
          navigate("/");
          window.scrollTo({ top: 0, behavior: "smooth" });
        },
      },
      {
        label: "Kurslar",
        NavIcon: SchoolOutlined,
        action: () => {
          navigate("/landing-page-courses");
          window.scrollTo({ top: 0, behavior: "smooth" });
        },
        isActive: location.pathname === "/landing-page-courses",
      },
      {
        label: "Kaynaklar",
        NavIcon: MenuBookOutlined,
        action: () => {
          navigate("/landing-page-resources");
          window.scrollTo({ top: 0, behavior: "smooth" });
        },
        isActive: location.pathname === "/landing-page-resources",
      },
      {
        label: "Danışmanlık",
        NavIcon: GroupsOutlined,
        action: () => {
          navigate("/landing-page-consultations");
          window.scrollTo({ top: 0, behavior: "smooth" });
        },
        isActive: location.pathname === "/landing-page-consultations",
      },
    ];

    items.push(
      {
        label: "İletişim",
        NavIcon: MailOutline,
        action: () => {
          navigate("/contact-us");
          window.scrollTo({ top: 0, behavior: "smooth" });
        },
        isActive: location.pathname === "/contact-us",
      },
      {
        label: "Hakkımızda",
        NavIcon: InfoOutlined,
        action: () => {
          navigate("/about-us");
          window.scrollTo({ top: 0, behavior: "smooth" });
        },
        isActive: location.pathname === "/about-us",
      },
    );

    return items;
  }, [location.pathname, navigate]);

  return (
    <AppBar position="sticky" sx={{ background: "none", boxShadow: "none" }}>
      <Box sx={{ position: "relative" }}>
        <Toolbar
          sx={{
            display: "flex",
            justifyContent: "space-between",
            width: "100%",
            height: isMobileLandscape
              ? "10vh"
              : isMobilePortrait
                ? "10vh"
                : isTabletPortrait
                  ? "10vh"
                  : isSmallScreen
                    ? "10vh"
                    : { md: "13vh", lg: "13vh" },
            backgroundColor: isScrolled ? "#FFFFFF" : "transparent",
            boxShadow: isScrolled ? "0 1px 8px rgba(0, 0, 0, 0.04)" : "none",
            borderBottom: isScrolled
              ? "1px solid rgba(0, 0, 0, 0.04)"
              : "1px solid transparent",
            position: "fixed",
            top: 0,
            px: isMobileSizeSmall ? "0.35rem" : "0.75rem",
            transition:
              "background-color 250ms ease, box-shadow 250ms ease, border-color 250ms ease",
            zIndex: 1201,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", flex: "0 0 auto" }}>
            {(isSmallScreen || isRotatedMedium) && (
              <IconButton onClick={() => setIsDrawerOpen(true)}>
                <Menu
                  sx={{ color: theme.textColor?.primary.main, padding: 0 }}
                  fontSize="small"
                />
              </IconButton>
            )}
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                cursor: "pointer",
              }}
              onClick={() => {
                navigate("/");
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            >
              <Box
                component="img"
                src={logo}
                alt="logo"
                sx={{
                  height: { xs: "6vh", sm: "6vh", md: "10vh" },
                  minHeight: "2rem",
                  maxHeight: "4.5rem",
                  width: "auto",
                }}
              />
            </Box>
          </Box>
          <LandingPageDrawer
            isDrawerOpen={isDrawerOpen}
            setIsDrawerOpen={setIsDrawerOpen}
            navItems={navItems}
          />

          {!(isSmallScreen || isRotatedMedium) && (
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                flex: "1 1 auto",
                minWidth: 0,
                flexWrap: "nowrap",
                gap: { md: 0.5, lg: 0.75 },
                px: { md: 0.5, lg: 1 },
              }}
            >
              {navItems
                ?.filter((item) => item.label !== "Ana Sayfa")
                ?.map((item, index) => {
                  const NavIcon =
                    "NavIcon" in item && item.NavIcon ? item.NavIcon : null;
                  return (
                    <Box
                      key={index}
                      onClick={item.action}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          item.action();
                        }
                      }}
                      sx={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: { md: 0.35, lg: 0.5 },
                        flexShrink: 0,
                        cursor: "pointer",
                        transformOrigin: "center",
                        transform: "scale(1)",
                        borderRadius: "999px",
                        px: { md: "0.55rem", lg: "0.85rem" },
                        py: { md: "0.35rem", lg: "0.45rem" },
                        border: "1.5px solid",
                        borderColor: item.isActive
                          ? "rgba(255, 107, 61, 0.65)"
                          : "rgba(1, 67, 90, 0.22)",
                        background: item.isActive
                          ? "linear-gradient(145deg, rgba(255,255,255,0.92) 0%, rgba(255,200,175,0.55) 45%, rgba(255,240,230,0.75) 100%)"
                          : "linear-gradient(150deg, rgba(255,255,255,0.94) 0%, rgba(232,242,250,0.92) 40%, rgba(210,230,245,0.88) 72%, rgba(190,218,238,0.82) 100%)",
                        boxShadow: item.isActive
                          ? "0 3px 14px rgba(255, 107, 61, 0.28), 0 0 0 1px rgba(255,255,255,0.6) inset"
                          : "0 2px 10px rgba(1, 67, 90, 0.1), 0 4px 20px rgba(1, 67, 90, 0.06), 0 0 0 1px rgba(255,255,255,0.55) inset, 0 1px 0 rgba(180,210,235,0.45) inset",
                        transition:
                          "transform 0.25s cubic-bezier(0.34, 1.3, 0.64, 1), box-shadow 0.25s ease, border-color 0.25s ease, background 0.25s ease",
                        ...(item.isActive
                          ? {
                              "&:hover": {
                                transform: "scale(1.07)",
                                borderColor: "rgba(255, 255, 255, 0.35)",
                                background: `linear-gradient(145deg, ${ADEN_BLUE_DEEP} 0%, ${ADEN_BLUE} 45%, ${ADEN_BLUE_BRIGHT} 100%)`,
                                boxShadow:
                                  "0 8px 26px rgba(0, 76, 153, 0.42), 0 0 0 1px rgba(255, 255, 255, 0.2) inset",
                              },
                              "&:hover .nav-pill-icon": {
                                color: "#FFFFFF",
                                fontSize: { md: "1.06rem", lg: "1.16rem" },
                              },
                              "&:hover .nav-pill-label": {
                                color: "#FFFFFF",
                                fontSize: { md: "0.84rem", lg: "0.96rem" },
                              },
                            }
                          : {
                              "&:hover": {
                                transform: "scale(1.07)",
                                borderColor: "rgba(255, 255, 255, 0.35)",
                                background: `linear-gradient(145deg, ${ADEN_BLUE_DEEP} 0%, ${ADEN_BLUE} 45%, ${ADEN_BLUE_BRIGHT} 100%)`,
                                boxShadow:
                                  "0 8px 26px rgba(0, 76, 153, 0.42), 0 0 0 1px rgba(255, 255, 255, 0.2) inset",
                              },
                              "&:hover .nav-pill-icon": {
                                color: "#FFFFFF",
                                fontSize: { md: "1.06rem", lg: "1.16rem" },
                              },
                              "&:hover .nav-pill-label": {
                                color: "#FFFFFF",
                                fontSize: { md: "0.84rem", lg: "0.96rem" },
                              },
                            }),
                        "&:focus-visible": {
                          outline: "2px solid #FF6B3D",
                          outlineOffset: 2,
                        },
                        "&:active": {
                          transform: "scale(1.03)",
                        },
                      }}
                    >
                      {NavIcon && (
                        <NavIcon
                          className="nav-pill-icon"
                          sx={{
                            fontSize: { md: "1rem", lg: "1.1rem" },
                            color: item.isActive ? "#FF6B3D" : "#01435A",
                            transition:
                              "color 0.25s ease, font-size 0.25s ease",
                          }}
                        />
                      )}
                      <Typography
                        className="nav-pill-label"
                        sx={{
                          fontFamily: "Varela Round",
                          color: item.isActive ? "#c43d15" : "#01435A",
                          fontWeight: item.isActive ? 700 : 600,
                          fontSize: { md: "0.78rem", lg: "0.88rem" },
                          lineHeight: 1.2,
                          whiteSpace: "nowrap",
                          transition:
                            "color 0.25s ease, font-size 0.25s cubic-bezier(0.34, 1.3, 0.64, 1)",
                        }}
                      >
                        {item.label}
                      </Typography>
                    </Box>
                  );
                })}
            </Box>
          )}
          <Box
            sx={{
              display: "flex",
              justifyContent: "flex-end",
              flex: "0 0 auto",
              alignItems: "center",
              gap: 2.5,
            }}
          >
            <Badge
              badgeContent={cartCount}
              color="primary"
              invisible={cartCount === 0}
              anchorOrigin={{ vertical: "top", horizontal: "right" }}
              sx={{
                "& .MuiBadge-badge": {
                  fontSize: isMobileSizeSmall ? "0.5rem" : "0.55rem",
                  minWidth: isMobileSizeSmall ? 12 : 14,
                  height: isMobileSizeSmall ? 12 : 14,
                  padding: 0,
                  borderRadius: "50%",
                  top: isMobileSizeSmall ? 8 : 8,
                  right: isMobileSizeSmall ? 8 : 8,
                  transition: "background-color 0.3s",
                },
                "&:hover .MuiBadge-badge": {
                  backgroundColor: "#ff7d55",
                },
              }}
            >
              <IconButton
                onClick={() => navigate("/landing-page-cart")}
                sx={{
                  color: theme.textColor?.primary?.main ?? "#0A1A2F",
                  "&:hover": { backgroundColor: "transparent" },
                }}
                aria-label="Sepet"
              >
                <ShoppingCart
                  fontSize={isMobileSizeSmall ? "small" : "large"}
                  sx={{ fontSize: isMobileSizeSmall ? "1.6rem" : "1.75rem" }}
                />
              </IconButton>
            </Badge>
            <Button
              sx={{
                fontFamily: "Varela Round",
                textTransform: "capitalize",
                fontSize: isMobileSizeSmall
                  ? "0.7rem"
                  : isMobileSize
                    ? "0.85rem"
                    : "1rem",
                color: "#FFFFFF",
                background: "#FF6B3D",
                padding: isMobileSize ? "0.4rem 1rem" : "0.5rem 1.75rem",
                borderRadius: { xs: "0.75rem", sm: "1rem", md: "1.25rem" },
                fontWeight: 500,
                boxShadow: "0 4px 15px rgba(255, 107, 61, 0.35)",
                "&:hover": {
                  background: "#ff7d55",
                  transform: "translateY(-2px)",
                  boxShadow: "0 6px 20px rgba(255, 107, 61, 0.45)",
                },
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              }}
              onClick={() => navigate("/auth")}
            >
              Giriş Yap
            </Button>
          </Box>
        </Toolbar>
      </Box>
    </AppBar>
  );
};

export default Header;
