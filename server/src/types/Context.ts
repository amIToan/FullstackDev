import { Request, Response } from 'express'
import { Session, SessionData } from 'express-session'
// import { buildDataLoaders } from 'src/utils/dataLoaders'
// import { Connection } from 'typeorm'
import { DataSource } from "typeorm"

export type Context = {
	req: Request & {
		session: Session & Partial<SessionData> & { userId?: number }
	}
	res: Response
	AppDataSource: DataSource
	// dataLoaders: ReturnType<typeof buildDataLoaders>
}