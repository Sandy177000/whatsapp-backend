import jwt from 'jsonwebtoken';

const protectRoute = async (req,res,next) =>{

    try {

        const token = req.cookies.jwtToken; // Retrieve the JWT token from the cookie in your route/middleware function
        

        // if token is undefined then user is not logged in 
        if(!token){
            console.log("unauthorized")
            return res.status(401).json({error:"Unauthorized user - Token not found"})
        }

        // token verification
        const verified = jwt.verify(token,"7taU6z8kZFL1V6IVUwk5");

        if(!verified){

            return res.status(401).json({error:"Unauthorized user - Invalid Token"})
        }

        console.log("protected endpoint")
        next();


    } catch (error) {
        console.log(error.message);
        res.status(500).json({error: "Internal Server Error"});
    }
}


export default protectRoute;