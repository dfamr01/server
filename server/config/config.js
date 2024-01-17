const url = require("url");
require("./dotenv")(); // load ENV vars
require("./log4js")(); // config logger

const {
    //general
    NODE_ENV,
    PORT,
    APP_NAME,
    APP_HOST,
    END_POINT_HOST,
    PROTOCOl,
    SESSION_SECRET,
    API_VERSION,

    // DB
    DB_HOST,
    DB_USER,
    DB_PWD,
    DB_NAME,
    DB_PORT,

    //redis
    REDIS_HOST,
    REDIS_PORT,

    // social media
    FACEBOOK_ID,
    FACEBOOK_SECRET,
    FACEBOOK_CALLBACK,
    GOOGLE_ID,
    GOOGLE_SECRET,
    GOOGLE_CALLBACK,
    LINKEDIN_ID,
    LINKEDIN_SECRET,
    LINKEDIN_CALLBACK,

    // mailer
    MAILER_USER,
    MAILER_USER_TEST,

    // cloudinary
    CLOUDINARY_HOST,
    CLOUDINARY_CLOUD,
    CLOUDINARY_KEY,
    CLOUDINARY_SECRET,

    // search
    ELASTICSEARCH_URL,
    ELASTICSEARCH_INDEX,

    //aws cred
    AWS_DEFAULT_REGION,
    AWS_ACCESS_KEY_ID,
    AWS_SECRET_ACCESS_KEY,

    //aws s3
    S3_BUCKET_NAME,

    // openExchangeRates
    OPEN_EXCHANGE_RATES_APP_ID,

    STRIP_SECRET_KEY,
    STRIP_WEBHOOK_CONNECT_SIG,
    STRIP_WEBHOOK_PAYMENTS_SIG,

    //zoom
    ZOOM_CLIENT_ID,
    ZOOM_CLIENT_SECRET,
    ZOOM_SDK_KEY,
    ZOOM_SDK_SECRET,
    ZOOM_SECRET,

    //SendGrid mail
    SENDGRID_API_KEY,
} = process.env;

const auth = DB_USER && DB_PWD ? `${DB_USER}:${DB_PWD}` : "";

const db = url.format({
    protocol: "postgres",
    slashes: true,
    hostname: DB_HOST,
    port: DB_PORT,
    pathname: DB_NAME,
    auth,
});
console.log("🚀 ~ db postgres:", db);

const appHost = NODE_ENV === "development" ? `dev.${APP_HOST}` : APP_HOST;
console.log("xxxx NODE_ENV", NODE_ENV);
console.log("xxxx process.env", process.env);
module.exports = {
    appName: APP_NAME,
    appHost,
    endPointHost: END_POINT_HOST,
    protocol: PROTOCOl,
    db,
    api: {
        version: API_VERSION,
        prefix: `/api/${API_VERSION}`,
    },
    redis: {
        host: REDIS_HOST,
        port: REDIS_PORT,
    },
    primus: { transformer: "engine.io", pathname: "connectPrimus" },
    secret: SESSION_SECRET,
    port: PORT || 3000,
    authToken: {
        expireIn: 45 * 24 * 60 * 60, // (45 days in seconds = 2419200)
    },
    emailVerificationToken: {
        expireIn: 2419200, // (28 days in seconds = 2419200)
    },
    resetPasswordToken: {
        expireIn: 172800, // (2 days in seconds = 172800)
    },
    facebook: {
        clientID: FACEBOOK_ID,
        clientSecret: FACEBOOK_SECRET,
        callbackURL: FACEBOOK_CALLBACK,
    },
    google: {
        clientID: GOOGLE_ID,
        clientSecret: GOOGLE_SECRET,
        callbackURL: GOOGLE_CALLBACK,
    },
    linkedin: {
        clientID: LINKEDIN_ID,
        clientSecret: LINKEDIN_SECRET,
        callbackURL: LINKEDIN_CALLBACK,
    },
    logger: {
        formatHttp: ":method :url :status :content-length",
        nolog: /\.(gif|jpe?g|png|css|woff2?)$/,
    },
    awsRegion: AWS_DEFAULT_REGION,
    awsAccessKeyId: AWS_ACCESS_KEY_ID,
    awsSecretAccessKey: AWS_SECRET_ACCESS_KEY,
    s3_bucket_name: S3_BUCKET_NAME,
    s3_signed_upload_url_expires: 3600,
    openExchRt_App_Id: OPEN_EXCHANGE_RATES_APP_ID,
    stripeSecretKey: STRIP_SECRET_KEY,
    stripeWebhookConnectSig: STRIP_WEBHOOK_CONNECT_SIG,
    stripeWebhookPaymentsSig: STRIP_WEBHOOK_PAYMENTS_SIG,

    //zoom_jwt_api_key: ZOOM_JWT_API_KEY,
    //zoom_jwt_api_secret: ZOOM_JWT_API_SECRET,
    zoom_sdk_key: ZOOM_SDK_KEY,
    zoom_sdk_secret: ZOOM_SDK_SECRET,
    zoom_secret: ZOOM_SECRET,
    zoom_client_id: ZOOM_CLIENT_ID,
    zoom_client_secret: ZOOM_CLIENT_SECRET,

    sendGrid_api: SENDGRID_API_KEY,

    mailer: {
        user: MAILER_USER,
        userTest: MAILER_USER_TEST,
    },
    cloudinary: {
        host: CLOUDINARY_HOST,
        cloud: CLOUDINARY_CLOUD,
        key: CLOUDINARY_KEY,
        secret: CLOUDINARY_SECRET,
    },
    currenciesBackupPath: "currencies",
    currenciesBackupFile: "currencies\\openexchangerates.json",
    multer: {
        tempFolder: "temp",
        profileCoverMaxSize: 5e6, // 5 MB
        avatarMaxSize: 5e6, // 5 MB
        mediaMaxSize: 5e6, // 5 MB
    },
    avatar: {
        transformation: {
            format: "jpg",
            width: 220,
            height: 220,
            crop: "limit",
        },
    },
    avatarHomePage: {
        transformation: {
            format: "jpg",
            width: 350,
            height: 350,
            crop: "limit",
        },
    },
    avatarThumbnail: {
        transformation: {
            format: "jpg",
            width: 50,
            height: 50,
            crop: "limit",
        },
    },
    coverPhoto: {
        transformation: {
            format: "png",
            width: 300,
            height: 240,
            crop: "fill",
        },
    },
    coverPhotoThumbnail: {
        transformation: {
            format: "png",
            width: 75,
            height: 60,
            crop: "fill",
        },
    },
    coverPhotoHomePage: {
        transformation: {
            format: "png",
            width: 600,
            height: 480,
            crop: "fill",
        },
    },
    coverPhotoInspect: {
        transformation: {
            format: "png",
            width: 1200,
            height: 960,
            crop: "fill",
        },
    },
    pollOptionThumbnail: {
        transformation: {
            format: "jpg",
            width: 50,
            height: 50,
            crop: "limit",
        },
    },
    search: {
        host: ELASTICSEARCH_URL,
        index: ELASTICSEARCH_INDEX,
        maxResults: 5,
    },
};
