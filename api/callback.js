export default async function handler(req, res) {
  // 1. Get the Keys
  const client_id = process.env.OAUTH_CLIENT_ID;
  const client_secret = process.env.OAUTH_CLIENT_SECRET;
  
  // 2. Check if we have a "Ticket" (code) from GitHub
  const { code } = req.query;

  // ============================================================
  // PHASE 1: THE START (Traffic Cop)
  // If there is no code, it means the user just clicked the button.
  // We must send them to GitHub to get authorization.
  // ============================================================
  if (!code) {
    if (!client_id) {
       return res.status(500).send("❌ System Error: Vercel is missing the OAUTH_CLIENT_ID.");
    }
    
    // Redirect the user to GitHub's login page
    const redirectUrl = `https://github.com/login/oauth/authorize?client_id=${client_id}&scope=repo,user`;
    return res.redirect(redirectUrl);
  }

  // ============================================================
  // PHASE 2: THE FINISH (Login Success)
  // If we DO have a code, it means the user is back from GitHub.
  // Now we exchange the code for a key.
  // ============================================================
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
    
    // Check if GitHub rejected the code
    if (data.error) {
      return res.status(401).send('GitHub Ticket Error: ' + data.error_description);
    }

    const token = data.access_token;
    const provider = 'github';
    
    // Create the message for the Admin Panel
    const msg = JSON.stringify({ token, provider });
    const fullMsg = "authorization:" + provider + ":success:" + msg;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Login Verified</title>
        <script>
          // 1. Put the key in the mailbox (storage)
          localStorage.setItem("cms_auth_token", '${fullMsg}');
          
          // 2. Send the signal (if window is connected)
          if (window.opener) {
            window.opener.postMessage('${fullMsg}', "*");
          }

          // 3. Close the window
          window.close();
        </script>
        <style>body{font-family:sans-serif;text-align:center;padding:50px;color:#166534;background:#dcfce7;}</style>
      </head>
      <body>
        <h1>✅ Login Successful!</h1>
        <p>Closing window...</p>
      </body>
      </html>
    `;

    res.setHeader('Content-Type', 'text/html');
    res.send(html);

  } catch (err) {
    res.status(500).send('Server Error: ' + err.message);
  }
}

