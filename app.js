require('dotenv').config();
var expressPackage = require("express");
var mysql = require("mysql2");
var app = expressPackage();
var exphbs = require("express-handlebars");

var path = require("path");
const cors = require('cors');
app.use(cors());
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
});

// connect to database
db.connect((err) => {
	if (err){
		console.error('Error connecting to MySQL:', err);
		return;
	}
	console.log('Connected to MySQL database');
});

// Create a new customer:
app.post('/customers', (req, res) => {
	const {name, email} = req.body;
	const query = "INSERT INTO customers (name, email) VALUES (?, ?)";
	db.query(query, [name, email], (err, results) => {
		if (err){
			console.error('Error creating customer:', err);
			return res.status(500).json({message: 'Error creating customer'});
		}
		res.status(201).json({id: results.insertId, name, email});
	});
});

// Get all customers:
app.get('/customers', (req, res) => {
	const query = 'SELECT * FROM customers';
	db.query(query, (err, results) => {
		if(err){
			console.error('Error fetching customers:', err);
			return res.status(500).json({message: 'Error fetching customers'});
		}
		res.json(results);
	});
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
})

var port = process.env.PORT || 8080;
app.listen(port);
console.log("Express started. Listening on port %s", port);