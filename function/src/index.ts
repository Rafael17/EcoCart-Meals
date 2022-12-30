import * as express from 'express';
import * as serverless from 'serverless-http';
import {
    errorLogger,
    errorResponder,
    invalidResource,
    verifyToken,
} from './middleware';
import * as dotenv from 'dotenv';
import routes from './mealsRoute';

dotenv.config();

const app = express();

app.use(verifyToken);

app.use('/', routes);

app.use(errorLogger);
app.use(errorResponder);
app.use(invalidResource);

exports.handler = serverless(app);
