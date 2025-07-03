module.exports = ({ env }) => ({
  stripeSecretKey: env('STRIPE_SECRET_KEY'),
  webhookSecret: env('STRIPE_WEBHOOK_SECRET'),
}); 