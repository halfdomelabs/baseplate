import Stripe from 'stripe';

import { config } from './config.js';

export const stripe = new Stripe(config.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});
