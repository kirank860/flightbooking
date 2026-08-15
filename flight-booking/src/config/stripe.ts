import Stripe from 'stripe';

// Constructed lazily (on first real use, i.e. once a request comes in) rather
// than at module import time. dotenv.config() runs in server.ts after its own
// import statements, and this project compiles to CommonJS where imports run
// as ordered require() calls - so reading process.env.STRIPE_SECRET_KEY at
// module load time here would race dotenv and see it as undefined.
let client: Stripe | null = null;

function getStripe(): Stripe {
  if (!client) {
    client = new Stripe(process.env.STRIPE_SECRET_KEY!);
  }
  return client;
}

export default getStripe;
