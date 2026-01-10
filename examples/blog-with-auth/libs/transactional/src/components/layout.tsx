import {
  Body,
  Column,
  Container,
  Head,
  Html,
  Img,
  Preview,
  Link as ReactEmailLink,
  Text as ReactEmailText,
  Row,
  Section,
} from '@react-email/components';
import * as React from 'react';

import { theme } from '../constants/theme.js';
import { Divider } from './divider.js';

interface EmailLayoutProps {
  children: React.ReactNode;
  previewText?: string;
}

const { branding } = theme;

export function EmailLayout({
  children,
  previewText,
}: EmailLayoutProps): React.ReactElement {
  const hasFooterLinks =
    branding.links.privacyPolicy ?? branding.links.termsOfService;

  return (
    <Html>
      <Head />
      {previewText && <Preview>{previewText}</Preview>}
      <Body style={styles.main}>
        <Container style={styles.container}>
          <Section style={styles.header}>
            <Row>
              {branding.logoUrl && (
                <Column style={{ width: `${branding.logoWidth + 8}px` }}>
                  <Img
                    src={branding.logoUrl}
                    width={branding.logoWidth}
                    height={branding.logoHeight}
                    alt={`${branding.name} Logo`}
                    style={{ borderRadius: '4px' }}
                  />
                </Column>
              )}
              <Column>
                <ReactEmailText style={styles.brandName}>
                  {branding.name}
                </ReactEmailText>
              </Column>
            </Row>
          </Section>

          <Divider spacing="sm" style={{ margin: '0' }} />

          {/* --- Dynamic Content Area --- */}
          <Section style={styles.content}>{children}</Section>

          {/* --- Global Footer --- */}
          <Section style={styles.footer}>
            <ReactEmailText style={styles.footerText}>
              © {branding.footer.copyrightYear} {branding.footer.companyName}.
              All rights reserved.
              <br />
              {branding.footer.address}
            </ReactEmailText>

            {hasFooterLinks && (
              <ReactEmailText
                style={{ ...styles.footerText, marginTop: '20px' }}
              >
                {branding.links.privacyPolicy && (
                  <ReactEmailLink
                    href={branding.links.privacyPolicy}
                    style={styles.footerLink}
                  >
                    Privacy Policy
                  </ReactEmailLink>
                )}
                {branding.links.privacyPolicy &&
                  branding.links.termsOfService && (
                    <>&nbsp;&nbsp;•&nbsp;&nbsp;</>
                  )}
                {branding.links.termsOfService && (
                  <ReactEmailLink
                    href={branding.links.termsOfService}
                    style={styles.footerLink}
                  >
                    Terms of Service
                  </ReactEmailLink>
                )}
              </ReactEmailText>
            )}
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const styles: Record<string, React.CSSProperties> = {
  main: {
    backgroundColor: theme.colors.background,
    fontFamily: theme.fontFamily,
    padding: '40px 0',
  },
  container: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius,
    margin: '0 auto',
    width: '100%',
    maxWidth: '560px',
    borderTop: `5px solid ${theme.colors.primary}`,
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    overflow: 'hidden',
  },
  header: {
    padding: '30px 40px 20px',
  },
  brandName: {
    fontSize: '18px',
    fontWeight: '700',
    color: theme.colors.foreground,
    margin: '0',
  },
  content: {
    padding: theme.spacing.sectionPadding,
  },
  footer: {
    backgroundColor: theme.colors.muted,
    padding: '30px 40px',
    textAlign: 'center',
  },
  footerText: {
    fontSize: '12px',
    color: theme.colors.mutedForeground,
    lineHeight: '1.5',
    margin: '4px 0',
  },
  footerLink: {
    color: theme.colors.mutedForeground,
    textDecoration: 'none',
  },
};
