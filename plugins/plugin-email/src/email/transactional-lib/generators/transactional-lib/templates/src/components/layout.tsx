// @ts-nocheck

import { Divider } from '$componentsDivider';
import { theme } from '$constantsTheme';
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

interface EmailLayoutProps {
  children: React.ReactNode;
  previewText?: string;
}

export function EmailLayout({
  children,
  previewText,
}: EmailLayoutProps): React.ReactElement {
  return (
    <Html>
      <Head />
      {previewText && <Preview>{previewText}</Preview>}
      <Body style={styles.main}>
        <Container style={styles.container}>
          <Section style={styles.header}>
            <Row>
              <Column style={{ width: '40px' }}>
                <Img
                  src="https://static.baseplate.dev/logo.png"
                  width="32"
                  height="32"
                  alt="Baseplate Logo"
                  style={{ borderRadius: '4px' }}
                />
              </Column>
              <Column>
                <ReactEmailText style={styles.brandName}>
                  Baseplate
                </ReactEmailText>
              </Column>
            </Row>
          </Section>

          <Divider spacing="sm" style={{ margin: '0' }} />

          {/* --- Dynamic Content Area --- */}
          <Section style={styles.content}>{children}</Section>

          {/* --- Global Footer --- */}
          {/* TODO: Replace placeholder footer links with real URLs before production deployment */}
          <Section style={styles.footer}>
            <ReactEmailText style={styles.footerText}>
              © 2026 Half Dome Labs LLC. All rights reserved.
              <br />
              Half Dome Labs LLC, 123 Main Street, San Francisco, CA 94103
            </ReactEmailText>

            <ReactEmailText style={{ ...styles.footerText, marginTop: '20px' }}>
              <ReactEmailLink href="#" style={styles.footerLink}>
                Privacy Policy
              </ReactEmailLink>
              &nbsp;&nbsp;•&nbsp;&nbsp;
              <ReactEmailLink href="#" style={styles.footerLink}>
                Terms of Service
              </ReactEmailLink>
            </ReactEmailText>
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
