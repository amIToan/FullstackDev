import { User } from '../entities/User'
import {
	Arg,
	Ctx,
	// FieldResolver,
	Mutation,
	// Query,
	Resolver,
	// Root
} from 'type-graphql'
import { UserMutationResponse } from '../types/UserMutationResponse'
import { RegisterInput } from '../types/RegisterInput'
import { Context } from '../types/Context'
import argon2 from 'argon2'
import { validateRegisterInput } from '../utils/validateRegisterInput'
import { LoginInput } from '../types/LoginInput'
import { COOKIE_NAME } from '../constant'
@Resolver(_of => User)
export class UserResolver
{ 
    @Mutation(_return => UserMutationResponse)
	async register(
		@Arg('registerInput') registerInput: RegisterInput,
		@Ctx() { req }: Context
	): Promise<UserMutationResponse>
	{
		const validateRegisterInputErrors = validateRegisterInput(registerInput)
		if (validateRegisterInputErrors !== null)
			return { code: 400, success: false, ...validateRegisterInputErrors }
		try {
			const { username, email, password } = registerInput
			const existingUser = await User.findOne({
				where: [{ username }, { email }]
			})
			if (existingUser)
				return {
					code: 400,
					success: false,
					message: 'Duplicated username or email',
					errors: [
						{
							field: existingUser.username === username ? 'username' : 'email',
							message: `${
								existingUser.username === username ? 'Username' : 'Email'
							} already taken`
						}
					]
				}

			const hashedPassword = await argon2.hash(password)

			const newUser = User.create({
				username,
				password: hashedPassword,
				email
			})

			await newUser.save()

			req.session.userId = newUser.id
			console.log("set cookie",req.session.userId)
			return {
				code: 200,
				success: true,
				message: 'User registration successful',
				user: newUser
			}
		} catch (error) {
			console.log(error)
			return {
				code: 500,
				success: false,
				message: `Internal server error ${error.message}`
			}
		}
	}
	@Mutation(_return => UserMutationResponse)
	async login(
		@Arg('loginInput') { usernameOrEmail, password }: LoginInput,
		@Ctx() { req }: Context
	): Promise<UserMutationResponse> {
		try {
			const existingUser = await User.findOneBy(
				usernameOrEmail.includes('@')
					? { email: usernameOrEmail }
					: { username: usernameOrEmail }
			)

			if (!existingUser)
				return {
					code: 400,
					success: false,
					message: 'User not found',
					errors: [
						{ field: 'wrong email or name', message: 'Username or email incorrect' }
					]
				}

			const passwordValid = await argon2.verify(existingUser.password, password)
			if (!passwordValid)
				return {
					code: 400,
					success: false,
					message: 'Wrong password',
					errors: [{ field: 'password', message: 'Wrong password' }]
				}

			// Create session and return cookie
			req.session.userId = existingUser.id
			console.log("set cookie",req.session.userId)
			return {
				code: 200,
				success: true,
				message: 'Logged in successfully',
				user: existingUser
			}
		} catch (error) {
			console.log(error)
			return {
				code: 500,
				success: false,
				message: `Internal server error ${error.message}`
			}
		}
	}
	@Mutation(_return => Boolean)
	logout(@Ctx() { req, res }: Context): Promise<boolean>
	{
		return new Promise((resolve, _reject) => {
			res.clearCookie(COOKIE_NAME)

			req.session.destroy(error => {
				if (error) {
					console.log('DESTROYING SESSION ERROR', error)
					resolve(false)
				}
				resolve(true)
			})
		})
	}
}