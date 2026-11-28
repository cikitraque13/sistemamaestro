import { bootEmbed } from './loaderCore';

bootEmbed(typeof window !== 'undefined' ? window : undefined);
