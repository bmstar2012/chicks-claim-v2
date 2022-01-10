// eslint-disable-next-line camelcase
import { responsiveFontSizes, unstable_createMuiStrictModeTheme } from '@material-ui/core';

export const COLORS = {
  blue: "#1975e6",
  blueWithTransparency: "rgba(25, 117, 230, 0.8)",
  gray: "#4e4e54",
  green: "#0ac2af",
  greenWithTransparency: "rgba(10, 194, 175, 0.8)",
  lightGreen: "rgba(51, 242, 223, 1)",
  lightBlue: "#83b9fc",
  nearBlack: "#000008",
  nearBlackWithMinorTransparency: "rgba(0,0,0,.25)",
  red: "#aa0818",
  darkRed: "#810612",
};

export const theme = responsiveFontSizes(
  unstable_createMuiStrictModeTheme({
    palette: {
      type: "dark",
      background: {
        default: COLORS.nearBlack,
        paper: COLORS.nearBlack,
      },
      divider: COLORS.gray,
      text: {
        primary: "rgba(255,255,255,0.98)",
      },
      primary: {
        main: COLORS.blueWithTransparency,
        light: COLORS.lightBlue,
      },
      secondary: {
        main: COLORS.greenWithTransparency,
        light: COLORS.lightGreen,
      },
      error: {
        main: COLORS.red,
      },
    },
    typography: {
      fontFamily: "'Bergern', sans-serif",
      h1: {
        fontWeight: "200",
      },
      h2: {
        fontWeight: "200",
      },
      h4: {
        fontWeight: "500",
      },
    },
    overrides: {
      MuiCssBaseline: {
        "@global": {
          "*": {
            scrollbarWidth: "thin",
            scrollbarColor: `${COLORS.gray} ${COLORS.nearBlackWithMinorTransparency}`,
          },
          "*::-webkit-scrollbar": {
            width: "8px",
            height: "8px",
            backgroundColor: COLORS.nearBlackWithMinorTransparency,
          },
          "*::-webkit-scrollbar-thumb": {
            backgroundColor: COLORS.gray,
            borderRadius: "4px",
          },
          "*::-webkit-scrollbar-corner": {
            // this hides an annoying white box which appears when both scrollbars are present
            backgroundColor: "transparent",
          },
        },
      },
      MuiAccordion: {
        root: {
          backgroundColor: COLORS.nearBlackWithMinorTransparency,
          "&:before": {
            display: "none",
          },
        },
        rounded: {
          "&:first-child": {
            borderTopLeftRadius: "16px",
            borderTopRightRadius: "16px",
          },
          "&:last-child": {
            borderBottomLeftRadius: "16px",
            borderBottomRightRadius: "16px",
          },
        },
      },
      MuiAlert: {
        root: {
          borderRadius: "8px",
          border: "1px solid",
        },
      },
      MuiButton: {
        root: {
          borderRadius: "5px",
          textTransform: "none",
        },
      },
      MuiLink: {
        root: {
          color: COLORS.lightBlue,
        },
      },
      MuiPaper: {
        rounded: {
          borderRadius: "16px",
        },
      },
      MuiStepper: {
        root: {
          backgroundColor: "transparent",
          padding: 0,
        },
      },
      MuiStep: {
        root: {
          backgroundColor: COLORS.nearBlackWithMinorTransparency,
          borderRadius: "16px",
          padding: 16,
        },
      },
      MuiStepConnector: {
        lineVertical: {
          borderLeftWidth: 0,
        },
      },
      MuiStepContent: {
        root: {
          borderLeftWidth: 0,
        },
      },
      MuiStepLabel: {
        label: {
          fontSize: 16,
          fontWeight: "200",
          "&.MuiStepLabel-active": {
            fontWeight: "200",
          },
          "&.MuiStepLabel-completed": {
            fontWeight: "200",
          },
        },
      },
      MuiTab: {
        root: {
          fontSize: 18,
          fontWeight: "200",
          padding: 12,
          textTransform: "none",
        },
      },
    },
  })
);
