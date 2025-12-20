export default function handler(req, res) {
  const { host } = req.headers;
  
  // Get the ID we saved in Vercel
  const client_id = process.env.OAUTH_CLIENT_ID;

  // Tell GitHub to send the user to our callback file
  const redirect_uri = `https://${host}/api/callback`;

  // Send the user to GitHub's login page
  const authorization_url = `https://github.com/login/oauth/authorize?client_id=${client_id}&redirect_uri=${redirect_uri}&scope=repo,user`;

  res.redirect(authorization_url);
}
