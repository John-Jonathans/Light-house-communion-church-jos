export default async function handler(req, res) {
  const client_id = process.env.OAUTH_CLIENT_ID;
  const client_secret = process.env.OAUTH_CLIENT_SECRET;
  const { code } = req.query;

  if (!code) {
    return res.status(400).send('Error: No code provided.');
  }

  try {
    const response = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ client_id, client_secret, code }),
    });

    const data = await response.json();
    const token = data.access_token;
    const provider = 'github';
    
    // Create the message string that Decap CMS expects
    const msg = JSON.stringify({ token, provider });
    const fullMsg = "authorization:" + provider + ":success:" + msg;

    const html = `
      <!DOCTYPE html>
      <html>
      <body>
        <script>
          // 1. Save the key to the "Mailbox" (LocalStorage)
          // This works even if the tabs are disconnected!
          localStorage.setItem("cms_auth_token", "${fullMsg}");

          // 2. Also try the old way (PostMessage) just in case
          if (window.opener) {
            window.opener.postMessage("${fullMsg}", "*");
          }
          
          // 3. Close this window immediately
          document.write("<h1 style='color:green; text-align:center; margin-top:50px;'>Login Saved! Closing...</h1>");
          setTimeout(() => { window.close(); }, 1000);
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
