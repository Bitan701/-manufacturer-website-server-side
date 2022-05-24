const express = require('express')
const cors = require('cors')
require('dotenv').config()
const { MongoClient, ServerApiVersion } = require('mongodb')
const app = express()
const port = process.env.PORT || 5000

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

		// ALL PRODUCTS IN http://localhost:5000/products
		app.get('/products', async (req, res) => {
			const query = {}
			const cursor = productCollection.find(query)
			const products = await cursor.toArray()
			res.send(products)
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

		app.get('/users', async (req, res) => {
			const users = await userCollection.find().toArray()
			res.send(users)
		})

		app.get('/users/:email', async (req, res) => {
			const query = { email: req.params.email }
			const cursor = userCollection.find(query)
			const products = await cursor.toArray()
			res.send(products)
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
