interface ZeptoMailEnv {
  ZEPTO_MAIL_API_KEY: string;
  ZEPTO_MAIL_API_URL: string;
  ZEPTO_MAIL_FROM_EMAIL: string;
  ZEPTO_MAIL_FROM_NAME: string;
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    };
    return entities[character];
  });
}

export async function sendMagicLinkEmail(env: ZeptoMailEnv, email: string, url: string) {
  const safeUrl = escapeHtml(url);
  const response = await fetch(env.ZEPTO_MAIL_API_URL, {
    method: 'POST',
    headers: {
      authorization: `Zoho-enczapikey ${env.ZEPTO_MAIL_API_KEY}`,
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      from: { address: env.ZEPTO_MAIL_FROM_EMAIL, name: env.ZEPTO_MAIL_FROM_NAME },
      to: [{ email_address: { address: email } }],
      subject: 'Your Culturio sign-in link',
      textbody: `Use this link to sign in to Culturio: ${url}\n\nIt expires in 5 minutes.`,
      htmlbody: `<p>Use this link to sign in to Culturio:</p><p><a href="${safeUrl}">Sign in to Culturio</a></p><p>This link expires in 5 minutes.</p>`
    })
  });

  if (!response.ok) {
    throw new Error(`ZeptoMail request failed with status ${response.status}`);
  }
}
