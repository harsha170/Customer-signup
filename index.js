const express = require("express");
const nodemailer = require("nodemailer")
const cors = require("cors")
const mongodb = require("mongodb")
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")
const mongoclient = mongodb.MongoClient
require("dotenv").config()
const objectId = mongodb.ObjectId
const dbUrl = process.env.DB_URl ||  "mongodb://127.0.0.1:27017"
const port = process.env.PORT || 3050
const auth = require("./jwt/authentication")
const app = express()
app.use(express.json());
app.use(cors());



app.get("/", async (req,res)=> {
    try {
        let clientInfo = mongoclient.connect(dbUrl)
        let db = clientInfo.db("users")
        let data = await db.collection("userData").find().toArray()
        res.status(200).json({ data })
    } catch (error) {
        console.log(error)
        res.send(500)
    }
})


app.post("login", async(req,res)=> {
    try {
        let clientInfo = mongoClient.connect(dbUrl)
        let db = clientInfo.db("users")
        let data = await db.collection("userData").findOne({ email:req.body.email })
        if(data){
            let isTrue = bcrypt.compare(req.body.password, data.password )
            let status = data.status
            if(isTrue){
                if(status == true){
                    let token = await jwt.sign(
                        { userId: data._id, userName: data.name},
                        process.env.PASS,
                        { expiresIn:"1h" }
                    )
                    res.status(200).json({ message: "Success", id: data._id, token})
                } else{
                    res.status(200).json({
                        message: "Please Click on Confirmation link to activate your account "
                    })
                }
                }else {
                    res.status(200).json({
                        message:"Login failed"
                    })
                }
            }else { 
                res.status(400).json({message:"User not registered "})
            }
            clientInfo.close()
        }
    catch (error) {
        console.log(error)
    }
})



app.post("/register", async (req,res) => {
    try {
        let clientInfo = await mongoClient.connect(dbUrl)
        let db = clientInfo.db("users")
        let data = await db.collection("userData").findOne({ email:req.body.email})
        if(data){
            res.status(400).json({ message:"User already registered"});
            clientInfo.close()
        } else{
            let salt = await bcrypt.genSalt(15)
            let hash = await bcrypt.hash(req.body.password, salt)
            req.body.password = hash;
            await db.collection("userData").insertOne(req.body)

            await db.collection("userData").updateOne({email: req.body.email})
            res.status(200).json({ message: "user registered successfully"})
            clientInfo.close()
        }
    } catch (error) {
        console.log(error)
    }
})


app.get("/activate/:mail/:string", async(req,res) => {
    try {
        let clientInfo = await mongoClient.connect(dbUrl)
        let db = clientInfo.db("users")
        let data = await db.collection("userData").findOne({ email: req.body.email})

        if(data.string == req.params.string){
            await db.collection("users").updateOne( { email: req.params.mail})
            res.redirect(``);
            res.status(200).json({message: "activated"})
        }else{
            res.status(200).json({message:"Link expired"})
        }
        clientInfo.close()
    } catch (error) {
        console.log(error)
    }
})




app.listen(port, ()=> console.log("App runs with port:",port))