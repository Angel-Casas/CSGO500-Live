const { MONGO_DB_URI_TEST, MONGO_DB_URI, DB_NAME, DB_NAME_TEST } = process.env;

console.log(process.env);

const dbName = process.env.NODE_ENV === "test" ? DB_NAME_TEST : DB_NAME;
const dbURI = process.env.NODE_ENV === "test" ? MONGO_DB_URI_TEST : MONGO_DB_URI;

module.exports = {
    url: `${dbURI}/${dbName}`,
    mongoOptions: {
        socketTimeoutMS: 90000,
        keepAlive: true,
        useNewUrlParser: true,
        useUnifiedTopology: true,
        useCreateIndex: true,
        useFindAndModify: false
    }
};