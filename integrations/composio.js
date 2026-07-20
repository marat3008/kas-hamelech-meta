// חיבור ל-Composio API — מאפשר לגרישה להפעיל כלי Meta Ads / WhatsApp דרך Composio.
// תיעוד: https://docs.composio.dev/reference/v3/authentication
const axios = require('axios');

const COMPOSIO_BASE_URL = 'https://backend.composio.dev/api/v3';

function client() {
  const apiKey = process.env.COMPOSIO_API_KEY;
  if (!apiKey) throw new Error('COMPOSIO_API_KEY חסר ב-.env');
  return axios.create({
    baseURL: COMPOSIO_BASE_URL,
    headers: { 'x-api-key': apiKey },
  });
}

// מחזיר את רשימת החשבונות המחוברים ל-Composio (למשל Meta Ads, WhatsApp)
async function listConnectedAccounts() {
  const { data } = await client().get('/connected_accounts');
  return data;
}

// מפעיל כלי (tool) ב-Composio, למשל META_ADS_GET_INSIGHTS או WHATSAPP_SEND_MESSAGE
async function executeTool(toolSlug, { arguments: toolArgs = {}, connectedAccountId, userId, version } = {}) {
  const body = {
    arguments: toolArgs,
    ...(connectedAccountId && { connected_account_id: connectedAccountId }),
    ...(userId && { user_id: userId }),
    ...(version && { version }),
  };
  const { data } = await client().post(`/tools/${toolSlug}/execute`, body);
  return data;
}

module.exports = { listConnectedAccounts, executeTool };
