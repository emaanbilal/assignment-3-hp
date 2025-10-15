import vercel from '@sveltejs/adapter-vercel';

// SvelteKit configuration
const config = {
  kit: {
    adapter: vercel({
      runtime: 'nodejs20.x',
      external: []
    })
  }
};

export default config;
