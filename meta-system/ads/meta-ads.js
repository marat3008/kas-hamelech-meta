// ===================================================
// Meta Ads API
// ניהול קמפיינים, מודעות, ותוצאות
// ===================================================

const axios = require('axios');

const BASE_URL   = 'https://graph.facebook.com/v23.0';
const AD_ACCOUNT = () => `act_${process.env.FB_AD_ACCOUNT_ID}`;
const TOKEN      = () => process.env.WA_SYSTEM_USER_TOKEN;

function getParams(extra = {}) {
  return { access_token: TOKEN(), ...extra };
}

// ===================================================
// יצירת קמפיין חדש
// ===================================================
async function createCampaign({ name, objective = 'MESSAGES', dailyBudget, status = 'PAUSED' }) {
  try {
    const { data } = await axios.post(
      `${BASE_URL}/${AD_ACCOUNT()}/campaigns`,
      {
        name,
        objective,                          // MESSAGES = Click-to-WhatsApp
        status,
        special_ad_categories: [],
        daily_budget: dailyBudget * 100     // Meta דורש בסנט/אגורה
      },
      { params: getParams() }
    );
    console.log(`✅ קמפיין נוצר: ${name} (ID: ${data.id})`);
    return data.id;
  } catch (err) {
    console.error('❌ שגיאה ביצירת קמפיין:', err.response?.data || err.message);
    throw err;
  }
}

// ===================================================
// שליפת סטטיסטיקות קמפיינים
// ===================================================
async function getCampaignInsights(dateRange = 'last_30_days') {
  try {
    const { data } = await axios.get(
      `${BASE_URL}/${AD_ACCOUNT()}/insights`,
      {
        params: getParams({
          date_preset: dateRange,
          fields: [
            'campaign_name',
            'campaign_id',
            'spend',
            'impressions',
            'clicks',
            'cpc',
            'cpm',
            'reach',
            'conversions',
            'cost_per_conversion',
            'actions'
          ].join(','),
          level: 'campaign'
        })
      }
    );
    return data.data || [];
  } catch (err) {
    console.error('❌ שגיאה בשליפת אנליטיקס:', err.response?.data || err.message);
    return [];
  }
}

// ===================================================
// שליפת כל הקמפיינים
// ===================================================
async function getAllCampaigns() {
  try {
    const { data } = await axios.get(
      `${BASE_URL}/${AD_ACCOUNT()}/campaigns`,
      {
        params: getParams({
          fields: 'id,name,status,objective,daily_budget,lifetime_budget,created_time'
        })
      }
    );
    return data.data || [];
  } catch (err) {
    console.error('❌ שגיאה בשליפת קמפיינים:', err.response?.data || err.message);
    return [];
  }
}

// ===================================================
// עדכון סטטוס קמפיין (הפעלה/כיבוי)
// ===================================================
async function updateCampaignStatus(campaignId, status) {
  // status: 'ACTIVE' | 'PAUSED'
  try {
    await axios.post(
      `${BASE_URL}/${campaignId}`,
      { status },
      { params: getParams() }
    );
    console.log(`✅ קמפיין ${campaignId} עודכן ל-${status}`);
    return true;
  } catch (err) {
    console.error('❌ שגיאה בעדכון קמפיין:', err.response?.data || err.message);
    return false;
  }
}

// ===================================================
// סיכום ביצועים לדשבורד
// ===================================================
async function getDashboardSummary() {
  const [campaigns, insights] = await Promise.all([
    getAllCampaigns(),
    getCampaignInsights('last_7_days')
  ]);

  const totalSpend   = insights.reduce((s, i) => s + parseFloat(i.spend || 0), 0);
  const totalLeads   = insights.reduce((s, i) => {
    const leadsAction = (i.actions || []).find(a => a.action_type === 'lead');
    return s + parseInt(leadsAction?.value || 0);
  }, 0);
  const costPerLead  = totalLeads > 0 ? (totalSpend / totalLeads).toFixed(2) : 0;

  return {
    activeCampaigns:   campaigns.filter(c => c.status === 'ACTIVE').length,
    totalCampaigns:    campaigns.length,
    last7Days: {
      spend:         totalSpend.toFixed(2),
      leads:         totalLeads,
      costPerLead
    },
    campaigns,
    insights
  };
}

module.exports = {
  createCampaign,
  getCampaignInsights,
  getAllCampaigns,
  updateCampaignStatus,
  getDashboardSummary
};
