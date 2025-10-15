import vercel from '@sveltejs/adapter-vercel';

// SvelteKit configuration
const config = {
  kit: {
    adapter: vercel({
      external: []
    })
  }
};

export default config;
