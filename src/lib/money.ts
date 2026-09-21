/**
 * Money on the site is Turkmen manat (TMT): course prices, payments and promo discounts are all
 * stored and shown in TMT.
 *
 * Card payments still go through Stripe in US dollars, because TMT is not a currency Stripe
 * charges in. The amount is converted at checkout with TMT_PER_USD (the official rate, 3.5 by
 * default), so the visitor always sees and agrees to the price in manat.
 */

export const CURRENCY = "TMT";

/** Official Central Bank of Turkmenistan rate; override with TMT_PER_USD if it changes. */
const DEFAULT_TMT_PER_USD = 3.5;

/** Stripe refuses card charges below 0.50 USD. */
const STRIPE_MIN_USD = 0.5;

export function tmtPerUsd() {
  const value = Number(process.env.TMT_PER_USD);
  return Number.isFinite(value) && value > 0 ? value : DEFAULT_TMT_PER_USD;
}

/** "1 900 TMT" — grouped for the locale, no fractions: prices are whole manat. */
export function formatMoney(amount: number | string | { toString(): string }, locale = "ru-RU") {
  const value = Number(amount);
  return `${new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(Number.isFinite(value) ? value : 0)} ${CURRENCY}`;
}

/** The charge Stripe receives, in US cents. */
export function toStripeUsdCents(amountTmt: number) {
  return Math.round((amountTmt / tmtPerUsd()) * 100);
}

/** The smallest TMT amount Stripe will accept as a card payment. */
export function minCardChargeTmt() {
  return Math.ceil(STRIPE_MIN_USD * tmtPerUsd());
}
