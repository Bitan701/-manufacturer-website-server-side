const express = require('express')
const cors = require('cors')
require('dotenv').config()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb')
const app = express()
const port = process.env.PORT || 5000

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)

app.use(cors())
app.use(express.json())

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@msi-mern-cluster.62ggsxg.mongodb.net/?retryWrites=true&w=majority`

const client = new MongoClient(uri, {
	useNewUrlParser: true,
	useUnifiedTopology: true,
	serverApi: ServerApiVersion.v1,
})

async function run() {
	try {
		await client.connect()
		const productCollection = client.db('msi-gc').collection('products')
		const userCollection = client.db('msi-gc').collection('users')
		const orderCollection = client.db('msi-gc').collection('orders')

		app.post('/create-payment-intent', async (req, res) => {
			const service = req.body
			const price = service.price
			const amount = price * 100
			const paymentIntent = await stripe.paymentIntents.create({
				amount: amount,
				currency: 'usd',
				payment_method_types: ['card'],
			})
			res.send({ clientSecret: paymentIntent.client_secret })
		})

		// ALL PRODUCTS IN http://localhost:5000/products
		app.get('/products', async (req, res) => {
			const query = {}
			const cursor = productCollection.find(query)
			const products = await cursor.toArray()
			res.send(products)
		})

		//get single product with id
		app.get('/products/:id', async (req, res) => {
			const id = req.params.id
			const query = { _id: ObjectId(id) }
			const product = await productCollection.findOne(query)
			res.send({ product })
		})

		// update quantity of a product
		app.put('/products/:id', async (req, res) => {
			const id = req.params.id
			const updatedProduct = req.body
			const filter = { _id: ObjectId(id) }
			const options = { upsert: true }
			const updatedDoc = {
				$set: {
					availableQuantity: updatedProduct.amount,
				},
			}
			const result = await productCollection.updateOne(
				filter,
				updatedDoc,
				options
			)
			res.send(result)
		})

		// Keep user information in database
		app.put('/users/:email', async (req, res) => {
			const email = req.params.email
			const user = req.body
			const filter = { email: email }
			const options = { upsert: true }
			const updateDoc = {
				$set: user,
			}
			const result = await userCollection.updateOne(filter, updateDoc, options)
			res.send(result)
		})

		// make user admin
		app.put('/users/admin/:email', async (req, res) => {
			const email = req.params.email
			const filter = { email: email }
			const updateDoc = {
				$set: { role: 'admin' },
			}
			const result = await userCollection.updateOne(filter, updateDoc)
			res.send(result)
		})

		// get all users
		app.get('/users', async (req, res) => {
			const users = await userCollection.find().toArray()
			res.send(users)
		})

		// get a single user
		app.get('/users/:email', async (req, res) => {
			const query = { email: req.params.email }
			const cursor = userCollection.find(query)
			const products = await cursor.toArray()
			res.send(products)
		})

		// insert order info
		app.post('/orders', async (req, res) => {
			const newCase = req.body
			const result = await orderCollection.insertOne(newCase)
			res.send(result)
		})

		// get all orders
		app.get('/orders', async (req, res) => {
			const query = {}
			const cursor = orderCollection.find(query)
			const products = await cursor.toArray()
			res.send(products)
		})

		// //get single order
		// app.get('/orders/:email', async (req, res) => {
		// 	const query = { email: req.params.email }
		// 	const cursor = orderCollection.findOne(query)
		// 	const order = await cursor.toArray()
		// 	res.send(order)
		// })

		// get order info
		app.get('/orders/:email', async (req, res) => {
			const query = { email: req.params.email }
			const cursor = orderCollection.find(query)
			const products = await cursor.toArray()
			res.send(products)
		})

		// Add review in order details
		app.put('/orders/:id', async (req, res) => {
			const id = req.params.id
			const filter = { _id: ObjectId(id) }
			const options = { upsert: true }
			const updateDoc = {
				$set: req.body,
			}
			const result = await orderCollection.updateOne(filter, updateDoc, options)
			res.send(result)
		})
	} finally {
	}
}
run().catch(console.dir)

app.get('/', (req, res) => {
	res.send('Hello World!')
})

app.listen(port, () => {
	console.log(`Example app listening on port ${port}`)
})
