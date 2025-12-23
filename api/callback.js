export default async function handler(req, res) {
  const client_id = process.env.OAUTH_CLIENT_ID;
  const client_secret = process.env.OAUTH_CLIENT_SECRET;
  const { code } = req.query;

  if (!code) {
    return res.status(400).send('Error: No code provided. Please try again.');
  }

  // 1. Get the Token from GitHub
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

    // 2. Prepare the Success Message (Visible HTML)
    const token = data.access_token;
    const provider = 'github';
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Login Success</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: sans-serif; text-align: center; padding: 40px; background-color: #f0fdf4; }
          .card { background: white; padding: 30px; border-radius: 15px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
          h1 { color: #166534; font-size: 24px; margin-bottom: 10px; }
          p { color: #4b5563; margin-bottom: 20px; }
          .btn { background: #166534; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block; }
        </style>
      </head>
      <body>
        <div class="card">
          <h1>✅ Login Successful!</h1>
          <p>We have received your key.</p>
          <p id="status">Sending signal to Admin Panel...</p>
        </div>

        <script>
          const token = "${token}";
          const provider = "${provider}";
          const msg = JSON.stringify({ token, provider });
          const fullMsg = "authorization:" + provider + ":success:" + msg;

          // Send the signal to the Main Window (Admin Panel)
          if (window.opener) {
            window.opener.postMessage(fullMsg, "*");
            document.getElementById('status').innerText = "Signal Sent! You can close this window.";
            
            // Try to close automatically after 1 second
            setTimeout(() => {
              window.close();
            }, 1500);
          } else {
             document.getElementById('status').innerText = "⚠️ Could not find the Admin Tab. Please switch tabs manually.";
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
