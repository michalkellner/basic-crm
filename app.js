require('dotenv').config();
var expressPackage = require("express");
var mysql = require("mysql2");
var app = expressPackage();
var exphbs = require("express-handlebars");

var path = require("path");

app.use(expressPackage.urlencoded({extended: true}));
app.use(expressPackage.json());

//tell express service to look in public folder for static files
app.use(expressPackage.static(path.join(__dirname, "public")));

// attach express handlebars package and tell it to look in the views folder
app.set("views", path.join(__dirname, "views"));

const db = mysql.createConnection({
	host: 'localhost',
	user: 'root',
	password: 'PolarPlunge',
	database: 'excrm'
}).promise();

// connect to database (dont need when using promise)
// db.connect((err) => {
// 	if (err){
// 		console.error('Error connecting to MySQL:', err);
// 		return;
// 	}
// 	console.log('Connected to MySQL database');
// });

// Create a new customer:
app.post('/new-customer', async (req, res) => {
	const {name, email} = req.body;
	const query = "INSERT INTO customers (name, email) VALUES (?, ?)";
	try {
		const [results] = await db.query(query, [name, email]);
		res.status(201).redirect('/new-customer');
	} catch (err) {
		console.error('Error creating customer:', err);
		res.status(500).json({message: 'Error creating customer'});
	}
});

// Create a new product:
app.post('/new-product', async (req, res) => {
	const {name, price, inventory, description} = req.body;
	const query = "INSERT INTO products (product_name, price, description, inventory) VALUES (?, ?, ?, ?)";
	try {
		const [results] = await db.query(query, [name, price, description, inventory]);
		res.status(201).redirect('/new-product');
	} catch (err) {
		console.error('Error creating product:', err);
		res.status(500).json({message: 'Error creating product'});
	}
});


app.post('/transactions', expressPackage.urlencoded({ extended: true }), async (req, res) => {
	console.log("body:", req.body);
	const { customer_id, product_id, quantity } = req.body;

	try {
		const [productRows] = await db.query(
			'SELECT inventory FROM products WHERE product_id = ?',
			[product_id]
		);
		const currentInventory = productRows[0]?.inventory ?? 0;
		const qty = parseInt(quantity);

		console.log('inventory is: ', currentInventory);

		// check that there is enough inventory for this transaction
		if (qty > currentInventory){
			return res.status(400).send('Not enough inventory');
		}

		// create transaction
		const insertQuery = "INSERT INTO transactions (product_id, customer_id, quantity) VALUES (?, ?, ?)";
		await db.query(insertQuery, [product_id, customer_id, quantity]);

		// update inventory
		const newInventory = currentInventory - qty;
		const updateQuery = "UPDATE products SET inventory = ? WHERE product_id = ?";
		await db.query(updateQuery, [newInventory, product_id]);
		res.status(201).redirect('/transactions');
	} catch (err) {
		console.error('Error processing transaction:', err);
		res.status(500).json({message: 'Error processing transaction'});
	}

  });
  

// Get all customers:
app.get('/customers', async (req, res) => {
	const query = 'SELECT * FROM customers';
	try {
		const [results] = await db.query(query);
		res.json(results);
	} catch (err) {
		console.error('Error fetching customers:', err);
		res.status(500).json({message: 'Error fetching customers'});
	}
});

// Get all products:
app.get('/products', async (req, res) => {
	const query = 'SELECT * FROM products';
	try {
		const [results] = await db.query(query);
		res.json(results);
	} catch (err){
		console.error('Error fetching customers:', err);
		res.status(500).json({message: 'Error fetching customers'});
	}
});

// Get all transactions:
app.get('/transactions', async (req, res) => {
	const query = 'SELECT * FROM transactions';
	try {
		const [results] = await db.query(query);
		res.json(results);
	} catch (err) {
		console.error('Error fetching transactions:', err);
		res.status(500).json({message: 'Error fetching transactions'});
	}
});

var hbs = exphbs.create({
	extname: ".hbs",
	defaultLayout: false,
	// helpers: require("./helpers") // use helpers to find partials
});

app.engine(".hbs", hbs.engine);
app.set("view engine", ".hbs");

app.get("/", function(req, res){
	res.render("home.hbs");
});

app.get("/new-customer", function(req, res){
	res.render("new-customer", {submitted: "no"});
});

app.get("/show-customers", function(req, res){
	res.render("show-customers");
});

app.get("/show-transactions", function(req,res){
	res.render("show-transactions");
})

app.get("/new-product", function(req, res){
	res.render("new-product");
});

app.get("/show-products", function(req, res){
	res.render("show-products");
});

app.get("/new-transaction", function(req, res){
	res.render("new-transaction");
});

app.get('/api/products', async (req, res) => {
	const query = `${req.query.query}%`;
	try {
		const [results] = await db.execute(
			'SELECT product_id, product_name FROM products WHERE product_name LIKE ? OR product_id LIKE ? LIMIT 10',
			[query, query]
		);
		res.json(results);
	} catch (err) {
		console.error("DB error:", err);
		res.status(500).json({error: 'Database error'});
	}
});


app.get('/api/customers', async(req, res) =>{
	const query = `${req.query.query}%`;
	try {
		const [results] = await db.execute(
			'SELECT id, name, email FROM customers WHERE name LIKE ? OR email LIKE ? LIMIT 10',
			[query, query]
		);
		res.json(results);
	} catch (err) {
		console.error("DB error:", err);
		res.status(500).json({error: 'Database error'});
	}
});


var port = process.env.PORT || 8080;
app.listen(port);
console.log("Express started. Listening on port %s", port);