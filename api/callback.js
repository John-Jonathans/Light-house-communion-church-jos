export default async function handler(req, res) {
  const client_id = process.env.OAUTH_CLIENT_ID;
  const client_secret = process.env.OAUTH_CLIENT_SECRET;
  const { code } = req.query;

  // PHASE 1: Redirect to GitHub if no code
  if (!code) {
    const redirectUrl = `https://github.com/login/oauth/authorize?client_id=${client_id}&scope=repo,user`;
    return res.redirect(redirectUrl);
  }

  // PHASE 2: Exchange Code for Key
  try {
    const response = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ client_id, client_secret, code }),
    });

    const data = await response.json();
    const token = data.access_token;
    const provider = 'github';
    const msg = JSON.stringify({ token, provider });
    const fullMsg = "authorization:" + provider + ":success:" + msg;

    // PHASE 3: Save Key and Redirect Back to Admin
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Login Success</title>
        <style>body{font-family:sans-serif;text-align:center;padding:50px;background:#f0fdf4;}</style>
      </head>
      <body>
        <h1 style="color:#166534;">✅ Login Verified!</h1>
        <p>Redirecting you to the dashboard...</p>
        
        <script>
          // 1. Save the key to the browser's mailbox
          localStorage.setItem("cms_auth_token", '${fullMsg}');

          // 2. Wait 1 second, then go back to the Admin Page
          setTimeout(() => {
            window.location.href = "/admin/";
          }, 1000);
        </script>
      </body>
      </html>
    `;

    res.setHeader('Content-Type', 'text/html');
    res.send(html);

  } catch (err) {
    res.status(500).send('Server Error: ' + err.message);
  }
}
