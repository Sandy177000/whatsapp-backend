import getPrismaInstance from "../utils/PrismaClient.js";
import { generateToken04 } from "../utils/TokenGenerator.js";
import jwt from "jsonwebtoken";

// login
export const checkUser = async (req, res, next) => {
  try {
    const { email } = req.body;
    console.log(email);
    if (!email) {
      return res.json({ msg: "email required", status: false });
    }
    const prisma = getPrismaInstance();
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return res.json({ msg: "user not found", status: false });
    } else {
      const token = jwt.sign({ userId: user.id }, "7taU6z8kZFL1V6IVUwk5", {
        expiresIn: "15d",
      });

      res.cookie("jwtToken", token, {
        SameSite: 'None',// important step : to allow frontend domain access to cookies
        httpOnly: true, // Prevents client-side scripts from accessing the cookie
        secure: true, // Ensures cookie is only sent over HTTPS
        maxAge: 36000000, // Sets the cookie's expiration time (1 hour in this example)
      });

      console.log("TOKEN!!!!!!!!!!!")
      console.log(res.getHeaders())

      console.log(token);

      return res.json({ msg: "user found", status: true, data: user, token : token });
    }
  } catch (error) {
    next(error);
  }
};

// sign up
export const onBoardUser = async (req, res, next) => {
  try {
    const { email, name, about, image: profilePicture } = req.body;

    if (!email || !name) {
      return res.send("Email and Name are required");
    }

    const prisma = getPrismaInstance();
    const cuser = await prisma.user.findUnique({ where: { email } });

    if (cuser)
      return res.json({ msg: "user already exists", status: false, cuser });

    const user = await prisma.user.create({
      data: {
        email,
        name,
        about,
        profilePicture,
      },
    });

    const token = jwt.sign({ userId: user.id }, "7taU6z8kZFL1V6IVUwk5", {
      expiresIn: "15d",
    });

    res.cookie("jwtToken", token, {
      SameSite: 'None',

      httpOnly: true, // Prevents client-side scripts from accessing the cookie
      secure: true, // Ensures cookie is only sent over HTTPS
      maxAge: 3600000, // Sets the cookie's expiration time (1 hour in this example)
    });

    

    return res.json({ msg: "Success", status: true, user });
  } catch (error) {
    console.log(error);
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const prisma = getPrismaInstance();
    const users = await prisma.user.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        profilePicture: true,
        about: true,
      },
    });

    const usersGroupedByInitialLetter = {};

    users.forEach((user) => {
      const initialLetter = user.name.charAt(0).toUpperCase();
      if (!usersGroupedByInitialLetter[initialLetter]) {
        usersGroupedByInitialLetter[initialLetter] = [];
      }

      usersGroupedByInitialLetter[initialLetter].push(user);
    });

    return res.status(200).send({ user: usersGroupedByInitialLetter });
  } catch (error) {
    console.log(error);
  }
};

export const logoutUser = (req, res) => {
  try {
    res.cookie("jwtToken", "", { maxAge: 0 });
    console.log("Logged out");
    return res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    return res.status(500).json({ error: "Interval Server Error" });
  }
};

//
export const generateToken = async (req, res, next) => {
  try {
    const appId = parseInt(process.env.ZEGO_APP_ID);
    const serverSecret = process.env.ZEGO_SERVER_ID;
    const userId = req.params.userId;

    const effectiveTime = 3600;
    const payload = "";

    if (appId && userId && serverSecret) {
      // generate token method is provided by zego
      const token = generateToken04(
        appId,
        userId,
        serverSecret,
        effectiveTime,
        payload
      );

      return res.status(200).json({ token });
    }

    return res.status(400).send("User id, server-secret, app id is required");
  } catch (error) {
    next(error);
  }
};
