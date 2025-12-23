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
    
    if (data.error) {
      return res.status(401).send('GitHub Error: ' + data.error_description);
    }

    const token = data.access_token;
    const provider = 'github';

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Login Success</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: sans-serif; text-align: center; padding: 20px; background-color: #f0fdf4; }
          .card { background: white; padding: 20px; border-radius: 10px; border: 2px solid #166534; }
          h1 { color: #166534; margin: 0; }
          .pulse { animation: pulse 1s infinite; color: red; font-weight: bold; margin-top: 15px; }
          @keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.5; } 100% { opacity: 1; } }
        </style>
      </head>
      <body>
        <div class="card">
          <h1>✅ Login Successful!</h1>
          <p>We have your key.</p>
          <div class="pulse">📡 BROADCASTING SIGNAL...</div>
          <br/>
          <p><strong>DO NOT CLOSE THIS WINDOW YET.</strong></p>
          <p>Tap the "Tabs" button on your phone and switch back to the <strong>Admin Page</strong> now.</p>
        </div>

        <script>
          const token = "${token}";
          const provider = "${provider}";
          const msg = JSON.stringify({ token, provider });
          const fullMsg = "authorization:" + provider + ":success:" + msg;

          function sendSignal() {
            if (window.opener) {
              window.opener.postMessage(fullMsg, "*");
              console.log("Signal sent");
            }
          }

          // Send the signal every 500ms (keep trying until the user switches tabs)
          setInterval(sendSignal, 500);
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
