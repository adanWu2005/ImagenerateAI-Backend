require('dotenv').config();
const express = require("express");
const cors = require('cors');
const path = require('path');
const OpenAI = require("openai");
const fs = require('fs')
const multer = require('multer')

const app = express();
app.use(cors());
app.use(express.json());

app.use('/', express.static(path.join(__dirname, 'public')));

const openai = new OpenAI({
    apiKey: process.env.OPENAI_KEY
});

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public')
    },
    filename: (req,file,cb) => {
        cb(null, Date.now() + "-" + file.originalname)
    }
})
const upload = multer({storage: storage}).single('file')
let filePath

app.post('/images', async (req, res) => {
    try { 
        const imgPrompt = req.body.message

        if (!imgPrompt){
            res.status(400).json({message: "Image prompt is required"})
        }

        console.log("Received prompt:", imgPrompt);
        const image = await openai.images.generate({
            model: "dall-e-3",
            prompt: imgPrompt,
        });

        console.log(image.data);
        res.json(image.data);
    } catch (err) {
        console.error(`Error: ${err}`);
        res.status(500).send("Error generating image");
    }
});

app.post('/upload', (req, res) => {
    upload(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            return res.status(500).json(err);
        } else if (err) {
            return res.status(500).json(err);
        }
        console.log(req.file.path);
        filePath = (req.file.path)
        res.status(200).json({ message: "File uploaded successfully", file: req.file });
    });
});

app.post('/variations', async (req, res) => {
    try {
        const image = await openai.images.createVariation({
            image: fs.createReadStream(filePath),
          });       
          console.log(image.data);
          res.setHeader('Content-Type', 'application/json');
          res.json(image.data)
    } catch (err) {
        console.log(`Error: ${err}`)
    }
})

app.listen(3001, () => {
    console.log("Server listening on port 3001");
});
