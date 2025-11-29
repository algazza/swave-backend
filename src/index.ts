import { Hono } from 'hono'
import { authRoute } from './routes/auth.route'
import { userRoute } from './routes/user.route'
import { AddressRoute } from './routes/address.route'
import { categoryRoute } from './routes/category.route'
import { variantRoute } from './routes/variant.route'

const app = new Hono().basePath('/api')

app.route('/auth', authRoute)
app.route('/account/profile', userRoute)
app.route('/account/address', AddressRoute)
app.route('/category', categoryRoute)
app.route('/variant', variantRoute)

export default app
