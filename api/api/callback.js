export default async function handler(req, res) {
  // 1. Get the temporary code from GitHub
  const code = req.query.code;
  const { host } = req.headers;

  if (!code) {
    return res.status(400).send('No code provided');
  }

  try {
    // 2. Exchange the code for a permanent key
    const response = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        client_id: process.env.OAUTH_CLIENT_ID,
        client_secret: process.env.OAUTH_CLIENT_SECRET,
        code: code
      })
    });

    const data = await response.json();
    const token = data.access_token;

    // 3. Send the key back to the CMS window
    const script = `
      <script>
        (function() {
          function receiveMessage(e) {
            console.log("receiveMessage %o", e);
            // Send the token
            window.opener.postMessage(
              'authorization:github:success:${JSON.stringify({ token: token, provider: 'github' })}',
              e.origin
            );
          }
          window.addEventListener("message", receiveMessage, false);
          
          // Trigger the message immediately
          window.opener.postMessage(
            'authorization:github:success:${JSON.stringify({ token: token, provider: 'github' })}',
            '*'
          );
        })();
      </script>
    `;

    res.setHeader('Content-Type', 'text/html');
    res.send(script);

  } catch (error) {
    console.error(error);
    res.status(500).send('Authentication failed');
  }
}
