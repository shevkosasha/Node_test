const express = require('express');
const app = express();

// app.use(require('body-parser').json());

// register endpoint
require('./app/reservations')(app);


app.listen(3333, () => {
 console.log('server started!');
});

