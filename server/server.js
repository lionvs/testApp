let express = require('express');
let morgan = require('morgan');
let cookieParser = require('cookie-parser');
let bodyParser = require('body-parser');
let http = require('http');
let apis = [
    require('./api/batch')
];
let logger = require('modules/logger');

let app = express();
app.use(cookieParser());
app.use(morgan('dev'));  // Create and display a HTTP logger middleware function
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ // to support URL-encoded bodies
    extended: true,
    limit: '50mb'
}));

apis.forEach(api => api(app));

app.use( (err, req, res, next) => {
    logger.error(err);
    res.status(200).send({
        error: true,
        message: err.message || "Unexpected error"
    })
});


let server = http.createServer(app);
let port = 8780;

server.listen(port, () => {
    console.log(`Server is running the app on port ${port} (localhost:${port})`);
});
