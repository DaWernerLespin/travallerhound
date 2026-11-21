/** Design tokens taken from the Click-Dummy (index.css). */
export const colors = {
  ink: '#142f36',
  muted: '#66797c',
  cream: '#fbf7ed',
  paper: '#fffdf8',
  canvas: '#f8f7f1',
  /** Logo orange: the one accent (small icons, arrow boxes, Bestellliste when ready). */
  brand: '#ed6119',
  yellow: '#f3b733',
  yellowSoft: '#fff0bf',
  coral: '#ed6119', // eyebrows and small links: same as the logo orange
  line: '#e5e4dc',
  green: '#31936a',
  greenSoft: '#dff2e9',
  /** "Wahrscheinlich sicher": friendlier than orange, clearly lighter than the confirmed green. */
  lightGreen: '#8cc56a',
  lightGreenText: '#4d7f2c',
  lightGreenSoft: '#eef7e4',
  red: '#e4523f',
  redSoft: '#fce7e2',
  orange: '#e9952d',
  orangeText: '#bc6d0e',
  orangeSoft: '#fff0da',
  welcomeText: '#c9d5d4',
  white: '#ffffff',
};

export const fonts = {
  body: 'DMSans_400Regular',
  bodyMedium: 'DMSans_500Medium',
  bodyBold: 'DMSans_700Bold',
  display: 'Manrope_800ExtraBold',
  displayBold: 'Manrope_700Bold',
  /** App name (wordmark) on the start screen. */
  wordmark: 'Pattaya_400Regular',
};

export const radius = { card: 19, button: 18, pill: 30 };

export const shadow = {
  shadowColor: colors.ink,
  shadowOpacity: 0.12,
  shadowRadius: 14,
  shadowOffset: { width: 0, height: 6 },
  elevation: 4,
};
