import * as express from "express";
import * as morgan from "morgan";
import env from "./env";

import searchRoute from "../routes/search_route";
import authRoute from "../routes/auth_route";
import videoRoute from "../routes/video_route";
import userRoute from "../routes/user_route";
import subscriptionRoute from "../routes/subscription_route";
import categoryRoute from "../routes/category_route";
import historyRoute from "../routes/history_route";

import cleanMiddleware from "../middlewares/clean_middleware";

import * as errorHandler from "../utils/error_handler";

const app: express.Application = express();

if (env.NODE_ENV === "development") {
    app.use(morgan("dev"));
}

app.use((req, res, next) => {
    req.local = { tempFilePaths: [] };
    next();
});

app.use("/search", searchRoute);
app.use("/auth", authRoute);
app.use("/videos", videoRoute);
app.use("/users", userRoute);
app.use("/subscriptions", subscriptionRoute);
app.use("/categories", categoryRoute);
app.use("/histories", historyRoute);

app.use(cleanMiddleware.removeTempFiles);

app.use(errorHandler.removeTempFiles);
app.use(errorHandler.clientErrorHandler);
app.use(errorHandler.serverErrorHandler);

export default app;
