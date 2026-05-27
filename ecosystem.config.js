module.exports = {
  apps: [
    {
      name: "pc-bang",
      script: "node_modules/.bin/next",
      args: "start",
      env: {
        PORT: 3000,
        NODE_ENV: "production",
      },
    },
  ],
};
