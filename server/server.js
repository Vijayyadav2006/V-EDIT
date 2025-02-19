const express = require('express');
const { createOAuthAppAuth } = require('@octokit/auth-oauth-app');
const app = express();
const port = 5000;

const auth = createOAuthAppAuth({
  clientType: 'oauth-app',
  clientId: 'Ov23liwzTy9pLq4DPrCx',
  clientSecret: 'ebdd95de9b10ec7aa2daeee9c979bf0c863fa134',
});

app.get('/auth/github', async (req, res) => {
  const { url, state } = await auth.getWebFlowAuthorizationUrl({
    redirectUrl: 'http://localhost:3000/auth/github/callback',
  });
  res.redirect(url);
});

app.get('/auth/github/callback', async (req, res) => {
  const { code, state } = req.query;
  const tokenAuthentication = await auth.createToken({
    code,
    state,
  });
  const { token } = tokenAuthentication;
  // Use the token to get user info and handle login
  res.redirect('http://localhost:3000/home'); // Redirect to your frontend home page
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
