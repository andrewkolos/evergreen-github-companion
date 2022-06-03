module.exports = {
  publishers: [
    {
      name: '@electron-forge/publisher-github',
      config: {
        authToken: process.env.GITHUB_TOKEN,
        repository: {
          owner: 'andrewkolos',
          name: 'evergreen-github-companion',
        },
        prerelease: true,
      },
    },
  ],
}
