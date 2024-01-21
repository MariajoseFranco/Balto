import express from 'express';
import bodyParser from 'body-parser';
import cron from 'node-cron';
import axios from 'axios';
import {
  createCustomer,
  updateCustomer,
  sendEmails,
  comparision,
  initializeCustomerData} from './functions.js';

const app = express();
const port = process.env.PORT || 3000;
const dotenv = await import('dotenv');
dotenv.config();

app.use(bodyParser.json());

const {SHOPIFY_STORE, SHOPIFY_ACCESS_TOKEN, HOST, MAIL_USER, PASSWORD} = process.env;
const shopifyGraphQLUrl = `https://${SHOPIFY_STORE}.myshopify.com/admin/api/2024-01/graphql.json`;
const headers = {
    'Content-Type': 'application/json',
    'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN,
  };

// Initializing customer data
let customerData = await initializeCustomerData(SHOPIFY_STORE, headers);

// Endpoint to receive Shopify webhook events for customer creation
app.post('/webhook/customer/create', async (req, res) => {
  const data = req.body;
  try {
    await createCustomer(data, shopifyGraphQLUrl, headers); // ESTO SE EJECUTA DOS VECES CORREGIR
    console.log('New Customer:', data);
    res.sendStatus(200);
  } catch (error) {
    console.error('Error creating customer:', error);
    res.sendStatus(400);
  }
});

// Endpoint to receive Shopify webhook events for customer updates
app.post('/webhook/customer/update', async (req, res) => {
  const data = req.body;
  try {
    await updateCustomer(data, shopifyGraphQLUrl, headers);
    console.log('Customer Updated:', data);
    res.sendStatus(200);
  } catch (error) {
    console.error('Error updating customer:', error);
    res.sendStatus(400);
  }
});

// Endpoint to receive webhook payloads
app.post('/webhook/social-media', (req, res) => {
  try {
    const payload = req.body;
    const customerId = payload.customer_shopify_id;
    customerData[customerId].totalLikes += payload.likes_gained_today;
    customerData[customerId].totalFollowers += payload.followers_gained_today;
    res.sendStatus(200);
  } catch (error) {
    console.error('Error receiving webhook payloads:', error);
    res.sendStatus(400);
  }
});

// Endpoint to trigger sending emails
app.get('/trigger-emails', (req, res) => {
  try {
    const topLikesCustomers = Object.values(customerData).sort((a, b) => comparision(a.totalLikes, b.totalLikes)).slice(0, 10);
    const topFollowersCustomers = Object.values(customerData).sort((a, b) => comparision(a.totalFollowers, b.totalFollowers)).slice(0, 10);
    topLikesCustomers.forEach(customer => sendEmails(customer, HOST, MAIL_USER, PASSWORD));
    topFollowersCustomers.forEach(customer => sendEmails(customer, HOST, MAIL_USER, PASSWORD));
    console.log('Emails triggered successfully');
    res.sendStatus(200)
  } catch (error) {
    console.error('Error triggering emails:', error);
    res.sendStatus(400);
  }
});

// Schedule the 'webhook/social-media' endpoint to run daily
cron.schedule('0 0 * * *', async () => {
  try {
    const payload = {
      "customer_shopify_id": "6534284279881",
      "likes_gained_today": 16,
      "followers_gained_today": 9
    };
    await axios.post(`http://localhost:3000/webhook/social-media`, {query: payload}, {headers});
    console.log('Social-Media Webhook endpoint executed successfully');
  } catch (error) {
    console.error('Error executing Social-Media Webhook endpoint:', error.message);
  }
});

// Schedule the 'trigger-emails' endpoint to run at the end of each month
cron.schedule('0 0 1 * *', async () => {
  try {
    await axios.get(`http://localhost:3000/trigger-emails`, {headers});
    console.log('Trigger-emails endpoint executed successfully');
  } catch (error) {
    console.error('Error executing trigger-emails endpoint:', error.message);
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port http://localhost:${port}`);
});