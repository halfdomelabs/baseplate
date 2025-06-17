// @ts-nocheck

import { config } from '%configServiceImports';
import Stripe from 'stripe';

export const stripe = new Stripe(config.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});
