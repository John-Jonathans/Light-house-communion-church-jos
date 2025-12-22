import fetch from 'node-fetch';

export default async function handler(req, res) {
  const client_id = process.env.OAUTH_CLIENT_ID;
  const client_secret = process.env.OAUTH_CLIENT_SECRET;
  const { code } = req.query; // The code GitHub gave us

  if (!code) {
    return res.status(400).send('No code provided');
  }

  // Exchange the code for a token
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
    return res.status(401).send(data.error_description);
  }

  // Send the token back to the Admin page
  const token = data.access_token;
  const provider = 'github';

  // Use the exact same host that requested the login
  const { host } = req.headers;

  // This script closes the popup and saves the token
  const script = `
    <script>
      (function() {
        function receiveMessage(e) {
          console.log("receiveMessage %o", e);

          // Send the token to the main window
          window.opener.postMessage(
            'authorization:${provider}:success:${JSON.stringify({
              token: '${token}',
              provider: '${provider}'
            })}',
            e.origin
          );
        }
        window.addEventListener("message", receiveMessage, false);

        // Send the message immediately in case the listener is already ready
        window.opener.postMessage(
          'authorization:${provider}:success:${JSON.stringify({
            token: '${token}',
            provider: '${provider}'
          })}',
          'https://${host}'
        );
      })();
    </script>
  `;

  res.setHeader('Content-Type', 'text/html');
  res.send(script);
}
