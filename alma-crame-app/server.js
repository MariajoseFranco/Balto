import {createCustomer, updateCustomer, sendEmails, comparision, initializeCustomerData} from './functions.js';
import express from 'express';
import bodyParser from 'body-parser';

const app = express();
const port = process.env.PORT || 3000;
const dotenv = await import('dotenv');
dotenv.config();

app.use(bodyParser.json());

const {SHOPIFY_STORE, SHOPIFY_ACCESS_TOKEN} = process.env;
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
    console.log('New Customer Created:', data);
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
    res.sendStatus(200);
  } catch (error) {
    console.error('Error updating customer:', error);
    res.sendStatus(400);
  }
});

// Endpoint to receive webhook payloads
app.post('/webhook/social-media', (req, res) => {
  const payload = req.body;
  const customerId = payload.customer_shopify_id;
  customerData[customerId].totalLikes += payload.likes_gained_today;
  customerData[customerId].totalFollowers += payload.followers_gained_today;
  res.sendStatus(200);
  console.log("###################################### CUSTOMER DATA ACTUALIZADO ######################################", customerData);
});

// Endpoint to trigger sending emails
app.get('/trigger-emails', (req, res) => {
  // Calculate the top 10 customers for likes and followers
  const topLikesCustomers = Object.values(customerData).sort((a, b) => comparision(a.totalLikes, b.totalLikes)).slice(0, 10);
  const topFollowersCustomers = Object.values(customerData).sort((a, b) => comparision(a.totalFollowers, b.totalFollowers)).slice(0, 10);
  topLikesCustomers.forEach(customer => sendEmails(customer));
  topFollowersCustomers.forEach(customer => sendEmails(customer));
  console.log('Emails triggered successfully');
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port http://localhost:${port}`);
});