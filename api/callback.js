export default async function handler(req, res) {
  const client_id = process.env.OAUTH_CLIENT_ID;
  const client_secret = process.env.OAUTH_CLIENT_SECRET;
  const { code } = req.query;

  // If the keys are missing on Vercel, tell the user immediately
  if (!client_id || !client_secret) {
    return res.status(500).send("❌ Error: Missing Vercel Environment Variables (OAUTH_CLIENT_ID or SECRET).");
  }

  if (!code) {
    return res.status(400).send('❌ Error: No code provided from GitHub.');
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
    
    if (data.error) {
      return res.status(401).send('GitHub Error: ' + data.error_description);
    }

    const token = data.access_token;
    const provider = 'github';
    const msg = JSON.stringify({ token, provider });
    const fullMsg = "authorization:" + provider + ":success:" + msg;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Login Verified</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: sans-serif; text-align: center; padding: 20px; background-color: #f0fdf4; }
          .card { background: white; padding: 20px; border-radius: 10px; border: 1px solid #ddd; }
          h1 { color: #166534; margin: 0 0 10px 0; }
          p { color: #555; }
          .warn { color: #d97706; font-size: 0.9em; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="card">
          <h1>✅ Login Verified!</h1>
          <p>We have received your security key.</p>
          <p>Sending it to the Admin Panel now...</p>
          
          <p class="warn">If this window does not close automatically, please <strong>close it manually</strong> and return to the Admin tab.</p>
        </div>

        <script>
          // We wrap this in a "Try/Catch" block so the page never crashes
          try {
            const message = '${fullMsg}';
            
            // 1. Try to save to Mailbox (LocalStorage)
            try {
              localStorage.setItem("cms_auth_token", message);
            } catch (e) {
              console.log("Mailbox blocked by browser settings.");
            }

            // 2. Try to send Direct Signal
            if (window.opener) {
              window.opener.postMessage(message, "*");
            }
            
            // 3. Close window after 2 seconds
            setTimeout(() => {
              window.close();
            }, 2000);

          } catch (err) {
            console.error("Script Error:", err);
          }
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
