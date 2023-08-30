const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const multer = require("multer");
const bodyParser = require("body-parser");
const fs = require("fs");

const app = express();
const port = process.env.PORT || 5000;

// sunrise
// VsR7XTCjckzGmiM3

//Middleware
app.use(cors());
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Multer configuration
const storage = multer.diskStorage({
	destination: function (req, file, cb) {
		cb(null, "./uploads");
	},
	filename: function (req, file, cb) {
		const fileName = `${new Date().getTime()}_${file.originalname}`;
		const normalizedFileName = fileName.replace("\\", "/");
		cb(null, normalizedFileName);
	},
});

const upload = multer({ storage });
app.use("/uploads", express.static("uploads"));

//Connect DB URI
const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri, {
	useNewUrlParser: true,
	useUnifiedTopology: true,
	serverApi: ServerApiVersion.v1,
});

async function run() {
	try {
		await client.connect();
		console.log("DB Connected");

		//DB Collections
		const projectsCollection = client.db("vrd-lab").collection("projects");
		const newsCollection = client.db("vrd-lab").collection("news");
		const teamCollection = client.db("vrd-lab").collection("team");
		const publicationsCollection = client
			.db("vrd-lab")
			.collection("publications");

		const articalesCollection = client.db("vrd-lab").collection("articale");

		/*----------------------------
             projects Collection
        ------------------------------*/

		app.post("/projects/create", upload.single("proImg"), async (req, res) => {
			// const newCollections = req.body;

			const proName = req.body.proName;
			const proCategory = req.body.proCategory;
			const proShDesc = req.body.proShDesc;
			const proDesc = req.body.proDesc;
			const proImg = req.file.path.replace(/\\/g, "/");

			const newProject = { proName, proCategory, proShDesc, proDesc, proImg };

			const newData = await projectsCollection.insertOne(newProject);
			res.send({ Message: "Project Added Successfully", newData });
		});

		app.get("/projects/all", async (req, res) => {
			const data = await projectsCollection.find({}).toArray();
			res.send({ Message: "Success!", data: data });
		});

		app.get("/projects/:id", async (req, res) => {
			const id = req.params.id;
			// console.log(id);
			const data = await projectsCollection.findOne({
				_id: new ObjectId(id),
			});
			res.send(data);
		});

		app.delete("/projects/:id", async (req, res) => {
			const id = req.params.id;

			const projectData = await projectsCollection.findOne({
				_id: new ObjectId(id),
			});
			if (!projectData) {
				return res.status(404).send({ Message: "Project not found" });
			}

			// Delete the project data from the database
			const deleteData = await projectsCollection.deleteOne({
				_id: new ObjectId(id),
			});
			// Now, delete the associated image file from the "uploads" directory
			const imagePath = projectData.proImg;
			try {
				fs.unlinkSync(imagePath); // This will delete the file synchronously
				console.log("Image deleted successfully");
			} catch (err) {
				console.error("Error deleting image:", err);
			}

			res.send({ Message: "Project deleted", deleteData });
		});

		app.put("/projects/:id", upload.single("proImg"), async (req, res) => {
			const id = req.params.id;
			const project = req.body;
			console.log(project);

			// Check if a new image is provided in the request
			if (req.file) {
				// Process the new image and store it
				const projImgPath = req.file.path;

				// Delete the old image if it exists
				if (project.proImg) {
					try {
						fs.unlinkSync(project.proImg);
						console.log("Old image deleted:", project.proImg);
					} catch (error) {
						console.log("Error deleting old image:", error);
					}
				}

				project.proImg = projImgPath;
			}

			const filter = { _id: new ObjectId(id) };
			const options = { upsert: true };
			const updateDoc = {
				$set: project,
			};
			const result = await projectsCollection.updateOne(
				filter,
				updateDoc,
				options
			);
			res.send({ result, project });
		});

		/*----------------------------
             News Collection
        ------------------------------*/

		app.post("/news/create", async (req, res) => {
			const data = req.body;
			const newData = await newsCollection.insertOne(data);
			res.send({ Message: "News Added Successfully", newData });
		});

		app.get("/news/all", async (req, res) => {
			const data = await newsCollection.find({}).toArray();
			res.send({ Message: "Success!", data: data });
		});

		app.get("/news/:id", async (req, res) => {
			const id = req.params.id;
			// console.log(id);
			const data = await newsCollection.findOne({
				_id: new ObjectId(id),
			});
			res.send(data);
		});

		app.delete("/news/:id", async (req, res) => {
			const id = req.params.id;
			const deleteData = await newsCollection.deleteOne({
				_id: new ObjectId(id),
			});
			res.send({ Message: "data Deleted", deleteData });
		});

		app.put("/news/:id", async (req, res) => {
			const id = req.params.id;
			const news = req.body;
			const filter = { _id: new ObjectId(id) };
			const options = { upsert: true };
			const updateDoc = {
				$set: news,
			};
			const result = await newsCollection.updateOne(filter, updateDoc, options);
			res.send({ result, news });
		});

		/*----------------------------
             Team Members Collection
        ------------------------------*/

		app.post("/team/create", upload.single("memberImg"), async (req, res) => {
			const memberName = req.body.memberName;
			const memberDesi = req.body.memberDesi;
			const memberCategory = req.body.memberCategory;
			const memberImg = req.file.path.replace(/\\/g, "/");
			const createdAt = new Date();

			const newMember = {
				memberName,
				memberDesi,
				memberCategory,
				memberImg,
				createdAt,
			};

			const newData = await teamCollection.insertOne(newMember);
			res.send({ Message: "New Member Added Successfully", newData });
		});

		app.get("/team/all", async (req, res) => {
			const data = await teamCollection.find({}).toArray();
			res.send({ Message: "Success!", data: data });
		});

		app.get("/team/:id", async (req, res) => {
			const id = req.params.id;
			// console.log(id);
			const data = await teamCollection.findOne({
				_id: new ObjectId(id),
			});
			res.send(data);
		});

		app.delete("/team/:id", async (req, res) => {
			const id = req.params.id;

			const memberData = await teamCollection.findOne({
				_id: new ObjectId(id),
			});
			if (!memberData) {
				return res.status(404).send({ Message: "Member not found" });
			}

			// Delete the member data from the database
			const deleteData = await teamCollection.deleteOne({
				_id: new ObjectId(id),
			});

			// Now, delete the associated image file from the "uploads" directory
			const imagePath = memberData.memberImg;
			try {
				fs.unlinkSync(imagePath); // This will delete the file synchronously
				console.log("Image deleted successfully");
			} catch (err) {
				console.error("Error deleting image:", err);
			}

			res.send({ Message: "Member deleted", deleteData });
		});

		app.put("/team/:id", upload.single("memberImg"), async (req, res) => {
			const id = req.params.id;
			const team = req.body;

			// Check if a new image is provided in the request
			if (req.file) {
				// Process the new image and store it
				const memberImgPath = req.file.path;

				// Delete the old image if it exists
				if (team.memberImg) {
					try {
						fs.unlinkSync(team.memberImg);
						console.log("Old image deleted:", team.memberImg);
					} catch (error) {
						console.log("Error deleting old image:", error);
					}
				}

				team.memberImg = memberImgPath;
			}

			const filter = { _id: new ObjectId(id) };
			const options = { upsert: true };
			const updateDoc = {
				$set: team,
			};
			const result = await teamCollection.updateOne(filter, updateDoc, options);
			res.send({ result, team });
		});

		/*----------------------------
            publications Collection
        ------------------------------*/

		app.post("/publications/create", async (req, res) => {
			const publiCategory = req.body.publiCategory;
			const publicationsLink = req.body.publicationsLink;
			const publicationsDesc = req.body.publicationsDesc;
			const createdAt = new Date();

			const newWork = {
				publiCategory,
				publicationsLink,
				publicationsDesc,
				createdAt,
			};

			console.log(newWork);

			const newData = await publicationsCollection.insertOne(newWork);
			res.send({ Message: "New publications Added Successfully", newData });
		});

		app.get("/publications/all", async (req, res) => {
			const data = await publicationsCollection.find({}).toArray();
			res.send({ Message: "Success!", data: data });
		});

		app.get("/publications/:id", async (req, res) => {
			const id = req.params.id;
			// console.log(id);
			const data = await publicationsCollection.findOne({
				_id: new ObjectId(id),
			});
			res.send(data);
		});

		app.delete("/publications/:id", async (req, res) => {
			const id = req.params.id;
			const deleteData = await publicationsCollection.deleteOne({
				_id: new ObjectId(id),
			});
			res.send({ Message: "data Deleted", deleteData });
		});

		app.put("/publications/:id", async (req, res) => {
			const id = req.params.id;
			const work = req.body;
			const filter = { _id: new ObjectId(id) };
			const options = { upsert: true };
			const updateDoc = {
				$set: work,
			};
			const result = await publicationsCollection.updateOne(
				filter,
				updateDoc,
				options
			);
			res.send({ result, work });
		});

		/*----------------------------
            Articales Collection
        ------------------------------*/

		app.post("/articale/create", upload.single("artiImg"), async (req, res) => {
			const title = req.body.title;
			const date = req.body.date;
			const proCategory = req.body.proCategory;
			const link = req.body.link;
			const authors = req.body.authors;
			const desc = req.body.desc;
			const articaleType = req.body.articaleType;
			const artiImg = req.file.path.replace(/\\/g, "/");
			createdAt = new Date();

			const newProject = {
				title,
				date,
				proCategory,
				link,
				authors,
				desc,
				artiImg,
				articaleType,
				createdAt,
			};

			const newData = await articalesCollection.insertOne(newProject);
			res.send({ Message: "Articale Added Successfully", newData });
		});

		app.get("/articale/all", async (req, res) => {
			const data = await articalesCollection.find({}).toArray();
			res.send({ Message: "Success!", data: data });
		});

		app.get("/articale/:id", async (req, res) => {
			const id = req.params.id;
			const data = await articalesCollection.findOne({
				_id: new ObjectId(id),
			});
			res.send(data);
		});

		app.delete("/articale/:id", async (req, res) => {
			const id = req.params.id;

			const projectData = await articalesCollection.findOne({
				_id: new ObjectId(id),
			});
			if (!projectData) {
				return res.status(404).send({ Message: "articale not found" });
			}

			// Delete the project data from the database
			const deleteData = await articalesCollection.deleteOne({
				_id: new ObjectId(id),
			});
			// Now, delete the associated image file from the "uploads" directory
			const imagePath = projectData.artiImg;
			try {
				fs.unlinkSync(imagePath); // This will delete the file synchronously
				console.log("Image deleted successfully");
			} catch (err) {
				console.error("Error deleting image:", err);
			}

			res.send({ Message: "articale deleted", deleteData });
		});

		app.put("/articale/:id", upload.single("artiImg"), async (req, res) => {
			const id = req.params.id;
			const project = req.body;

			// Check if a new image is provided in the request
			if (req.file) {
				// Process the new image and store it
				const projImgPath = req.file.path;

				// Delete the old image if it exists
				if (project.artiImg) {
					try {
						fs.unlinkSync(project.artiImg);
						console.log("Old image deleted:", project.artiImg);
					} catch (error) {
						console.log("Error deleting old image:", error);
					}
				}

				project.artiImg = projImgPath;
			}

			const filter = { _id: new ObjectId(id) };
			const options = { upsert: true };
			const updateDoc = {
				$set: project,
			};
			const result = await articalesCollection.updateOne(
				filter,
				updateDoc,
				options
			);
			res.send({ result, project });
		});
	} finally {
	}
}

run().catch(console.dir);

app.get("/", (req, res) => {
	res.send("Hello From VRD Research Lab!");
});

app.listen(port, () => {
	console.log(`VRD Research Lab listening on port ${port}`);
});
