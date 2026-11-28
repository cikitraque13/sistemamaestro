const base = require('./tailwind.config.js');

module.exports = {
  ...base,
  content: [
    './src/embed/**/*.{js,jsx}',
    './src/features/home/voice/**/*.{js,jsx}',
    './src/hooks/useVoice.js',
  ],
};
