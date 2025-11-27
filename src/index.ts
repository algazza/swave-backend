import { Hono } from 'hono'
import { authRoute } from './routes/auth.route'
import { userRoute } from './routes/user.route'

const app = new Hono().basePath('/api')

app.route('/auth', authRoute)
app.route('/account/profile', userRoute)

export default app
