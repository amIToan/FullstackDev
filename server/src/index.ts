require('dotenv').config()
import 'reflect-metadata'
import express from "express"
import AppDataSource from './data-source'
import { ApolloServer } from 'apollo-server-express'
import { buildSchema } from 'type-graphql'
import { ApolloServerPluginLandingPageGraphQLPlayground } from 'apollo-server-core'
import { HelloResolver } from './resolvers/hello'
import { UserResolver } from './resolvers/user'
import mongoose from 'mongoose'
import MongoStore from 'connect-mongo'
import session from 'express-session'
import { Context } from './types/Context'
import { COOKIE_NAME,__pro__ } from './constant'
import { PostResolver } from './resolvers/post'
const main =async () => {
   AppDataSource.initialize()
    .then(() => {
        // here you can start to work with your database
    })
    .catch((error) => console.log(error))
    const apolloServer = new ApolloServer({
        schema: await buildSchema({ resolvers: [HelloResolver, UserResolver, PostResolver], validate: false }),
        context: ({ req, res }): Context => ({
			req,
			res,
			AppDataSource,
			// dataLoaders: buildDataLoaders()
		}),
        plugins: [ApolloServerPluginLandingPageGraphQLPlayground()],
    })
    await apolloServer.start()
    // Session/Cookie store
    const mongoUrl = `mongodb+srv://${process.env.SESSION_MONGOOSE_USERNAME}:${process.env.SESSION_MONGOOSE_PASSWORD}@redisfullstack.2bftb.mongodb.net/?retryWrites=true&w=majority`
    mongoose.connect(mongoUrl).catch(error => console.log(error));
    const PORT = process.env.PORT || 4000
    const app = express()
    app.set('trust proxy', 1)
    app.use(
		session({
			name: COOKIE_NAME,
			store: MongoStore.create({ mongoUrl }),
			cookie: {
				maxAge: 1000 * 60 * 60, // one hour
				httpOnly: true, // JS front end cannot access the cookie
				secure: __pro__, // cookie only works in https
				sameSite: 'lax'
			},
			secret: process.env.SESSION_SECRET_DEV_PROD as string,
			saveUninitialized: false, // don't save empty sessions, right from the start
			resave: false
		})
	)
    apolloServer.applyMiddleware({ app, cors: false })
    app.listen(PORT, () => console.log('server starting on the port:' + PORT, `GraphSQLServer processing on${PORT}${apolloServer.graphqlPath} `))
}
main().catch( error => console.log(error))