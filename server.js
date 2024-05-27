const express=require("express")
const {port, connectionstring, secret, password}=require("./constants.js")

const mongoose=require("mongoose")
const jwt=require("jsonwebtoken")
const bcrypt=require("bcrypt");

const app=express()
app.use(express.json())


const authenticatejwt=(req,res,next)=>{
    const token=req.headers['authorization'];
    const restoken=token && token.split(" ")[1];
    if(restoken){
        jwt.verify(restoken,secret)
        next()
    }
    else{
        res.status(401).send({message:"unauthorized"})
    }
}




const userSchema=new mongoose.Schema({
    username:String,
    password:String,
    purchasedCourses:[{type:mongoose.Schema.Types.ObjectId,ref:"Course"}]

});

const adminSchema=new mongoose.Schema({
    username:String,
    password:String,

});

const courseSchema=new mongoose.Schema({
    title:String,
    description:String,
    price:Number,
    imageLink:String,
    published:Boolean,
});

const User=mongoose.model("User",userSchema)
const Admin=mongoose.model("Admin",adminSchema)
const Course=mongoose.model("Course",courseSchema)


const connect=async()=>{
    try{
        await mongoose.connect(connectionstring);
        console.log("Database connected successfully")
    }
    catch(error){
        console.error("error connecting to database",error)
    }
}

connect()


// adminSchema.pre('save',async function(next){
//     console.log("middleware executing");
//     if(!this.isModified('password')){
//         return next()
//     }
//     try{
//         const salt=await bcrypt.genSalt(10);
//         this.password=await bcrypt.hash(this.password,salt);
//         next()
//     }
//     catch(error){
//         next(error)
//     }
// });




 app.post("/admin/signup",async(req,res)=>{
    const {username,password}=req.body;
    const admin= await Admin.findOne({username})
    if(admin){
        res.status(403).json({message:"Admin already exists"})
    }
    else{
        const salt=await bcrypt.genSalt(10);
        const hashed =await bcrypt.hash(password,salt)
        const newAdmin=new Admin({username:username,password:hashed});
        await newAdmin.save();
        const token=jwt.sign({username,role:"admin"},secret,{expiresIn:'1h'})
        res.json({message:"Admin created successfully",token});
    }
 })

 app.post("/admin/login",async(req,res)=>{
    const {username,password}=req.body;
    const admin=await Admin.findOne({username});
    if(admin){
        const ismatch=await bcrypt.compare(password,admin.password)
        if(ismatch){
        const token=jwt.sign({username,role:admin},secret,{expiresIn:'1h'})
        res.json({message:"Login successful",token})}
        else{
            res.status(403).send({message:"Invalid credentials"})
        }
    }
    else{
        res.status(403).json({message:"Invalid username or password"})
    }
 });

 app.post("/admin/addcourse",authenticatejwt,async(req,res)=>{
    const course=new Course(req.body);
    await course.save()
    res.json({message:"course created successfully",courseId:course.id})
 })

   
app.listen(port,(error)=>{
    console.log("server started successfully")
})