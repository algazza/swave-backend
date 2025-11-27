import { Hono } from 'hono'
import { authRoute } from './routes/auth.route'

const app = new Hono().basePath('/api')

app.route('/auth', authRoute)

export default app
