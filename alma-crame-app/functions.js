import axios from 'axios';
import nodemailer from 'nodemailer';

// Function to create a customer. This function receives:
// customerData: a JSON payload with the information of the customer to create
// shopifyGraphQLUrl: The Shopify Admin GraphQL url
// headers: The headers required for making a request
export async function createCustomer(customerData, shopifyGraphQLUrl, headers) {
  const createCustomerQuery = `
  mutation {
    customerCreate(input: {
    email: "${customerData.email}",
    firstName: "${customerData.first_name}",
    lastName: "${customerData.last_name}",
  }) {
    customer {
      id
      firstName
      lastName
    }
    userErrors {
      field
      message
    }
   }
  }`;
  try {
    const response = await axios.post(shopifyGraphQLUrl, {query: createCustomerQuery}, {headers});
    const responseData = response.data.data.customerCreate;

    if (responseData.userErrors && responseData.userErrors.length > 0) {
      console.error('Error creating customer:', responseData.userErrors);
    } else {
      const newCustomer = responseData.customer;
      console.log('Customer Created Correctly');
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Function to update a customer. This function receives:
// customerData: a JSON payload with the information of the customer to update
// shopifyGraphQLUrl: The Shopify Admin GraphQL url
// headers: The headers required for making a request
export async function updateCustomer(customerData, shopifyGraphQLUrl, headers) {
  const updateCustomerQuery = `
  mutation {
    customerUpdate(input: {
      id: "${customerData.id}",
      email: "${customerData.email}",
      firstName: "${customerData.first_name}",
      lastName: "${customerData.last_name}",
    }) {
      customer {
        id
        email
      }
      userErrors {
        field
        message
      }
    }
  }`;
  try {
    const response = axios.post(shopifyGraphQLUrl, {query: updateCustomerQuery}, {headers});
    const responseData = response.data.data.customerUpdate;

    if (responseData.userErrors && responseData.userErrors.length > 0) {
      console.error('Error updating customer:', responseData.userErrors);
    } else {
      const updatedCustomer = responseData.customer;
      console.log('Customer Updated Correctly');
    }
  } catch (error) {
    console.error('Error:', error.message); // ACA ME SALE UN ERROR QUE HAY QUE CORREGIR
  }
}

// Function to compare 2 elements. This function receives:
// firstElement: First element to compare
// secondElement: Second element to compare
export function comparision(firstElement, secondElement) {
  return secondElement - firstElement
}

// Function to get customer social-media data and personal data into a single variable
// This function receives:
// customerData: An empty variable that will be filled with the customer's information
// customer: The customer information
export async function fillingCustomerData(customerData, customer) {
  customerData[customer.id] = {
    totalLikes: 0,
    totalFollowers: 0,
    firstName: customer.first_name,
    lastName: customer.last_name,
    email: customer.email,
    signupDate: customer.created_at,
  };
}

// Function to send emails. This function receives:
// customer: The costumer information
// HOST: SMTP server that is used to send emails
// MAIL_USER: Email user
// PASSWORD: Password
export async function sendEmails(customer, HOST, MAIL_USER, PASSWORD) {
  // Configure transporter
  const transporter = nodemailer.createTransport({
    host: `smtp.${HOST}.com`,
    port: 587,
    secure: false,
    auth: {
      user: `${MAIL_USER}`,
      pass: `${PASSWORD}`,
    },
  });

  // Configure mail options
  const mailOptions = {
    from: `${MAIL_USER}`,
    to: customer.email,
    subject: 'Congratulations!',
    text: `Congrats ${customer.name}! Ever since you became a Balto customer on ${customer.signupDate}, you've gained ${customer.totalLikes} likes and ${customer.totalFollowers} follows.`,
  };

  // Send the email
  try {
    await transporter.sendMail(mailOptions);
    console.log(`Email sent to ${customer.name}`);
  } catch (error) {
    console.error('Error sending email:', error);
  }
}

// Function to initialize customerData with all customers from Shopify.
// This function receives:
// SHOPIFY_STORE: The name of the Shopify Store
// headers: The headers required for making a request
export async function initializeCustomerData(SHOPIFY_STORE, headers) {
  var customerData = {};
  const shopifyApiUrl = `https://${SHOPIFY_STORE}.myshopify.com/admin/api/2024-01/customers.json`;
  try {
    const response = await axios.get(shopifyApiUrl, {headers});
    const customers = response.data.customers;
    customers.forEach(customer => {fillingCustomerData(customerData, customer)});
    console.log('Customer data initialized successfully');
    return(customerData)
  } catch (error) {
    console.error('Error initializing customer data:', error.message);
  }
}