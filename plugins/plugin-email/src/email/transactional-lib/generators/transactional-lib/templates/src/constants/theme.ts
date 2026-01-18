// @ts-nocheck

/**
 * Email theme configuration.
 *
 * IMPORTANT: Update the `branding` section below with your company's information
 * before deploying to production.
 */
export const theme = {
  /**
   * Branding configuration for email templates.
   * Update these values with your company's information.
   */
  branding: {
    /** Company or product name displayed in the email header */
    name: 'Your Company',
    /** URL to your logo image (set to undefined to hide the logo) */
    logoUrl: undefined as string | undefined,
    /** Logo dimensions */
    logoWidth: 32,
    logoHeight: 32,
    /** Company information for the footer */
    footer: {
      companyName: 'Your Company Inc.',
      address: '123 Main Street, City, ST 12345',
      /** Copyright year (defaults to current year if not set) */
      copyrightYear: new Date().getFullYear(),
    },
    /** Footer links (set href to undefined to hide) */
    links: {
      privacyPolicy: undefined as string | undefined,
      termsOfService: undefined as string | undefined,
    },
  },
  colors: {
    primary: '#1e40af',
    primaryForeground: '#f8fafc',
    secondary: '#f1f5f9',
    secondaryForeground: '#0f172a',
    background: '#f3f4f6',
    card: '#ffffff',
    foreground: '#020617',
    mutedForeground: '#64748b',
    muted: '#f1f5f9',
    border: '#e2e8f0',
  },
  spacing: {
    containerPadding: '24px',
    sectionPadding: '32px',
  },
  typography: {
    sizes: {
      xs: '12px',
      sm: '14px',
      base: '16px',
      lg: '18px',
      xl: '20px',
      '2xl': '24px',
      '3xl': '30px',
    },
    lineHeights: {
      none: '1',
      tight: '1.25',
      normal: '1.5',
      relaxed: '1.625',
    },
    weights: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
  },
  borderRadius: '8px',
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
};
