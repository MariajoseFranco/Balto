# Balto

Para correr los scripts:
1. Instalar ngrok
2. Abrir la terminal y escribir el comando "ngrok http 3000"
3. Alli encontraremos un url "Forwarding", lo vamos a copiar y lo vamos a pegar en Shopify Admin -> Settings -> Notifications -> Webhooks. Editamos los webhooks existentes y cambiamos la url que ahi aparece por la que acabamos de copiar.
4. Abrimos otra terminal sin cerrar la que utilizamos anteriormente y accedemos a la carpeta en la que vamos a trabajar
5. Escribimos "npm start" y este comando ejecutará el script "server.js"
6. Luego, abrimos postman y podemos hacer los siguientes requests: crear un nuevo cliente, actualizarle la informacion a un cliente existente.
7. Tambien podemos verificar los endpoints "trigger-emails" y "webhook/social-media" desde alli.