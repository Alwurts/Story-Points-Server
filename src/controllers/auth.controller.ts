import { Request, Response, NextFunction } from "express";
import userService from "../services/user.service";

const signup = (request: Request, response: Response, next: NextFunction) => {
  try {
    const { userName } = request.body;
    if (!userName) {
      const err: any = new Error("No userName");
      err.statusCode = 400;
      return next(err);
    }
    const newUser = userService.createUser(userName);
    response.json(newUser);
  } catch (error) {
    next(error);
  }
};

const signin = (request: Request, response: Response, next: NextFunction) => {
  try {
    const { userName, id } = request.body;
    if (!userName || !id) {
      const err: any = new Error("No userName or id");
      err.statusCode = 400;
      return next(err);
    }
    const updatedUser = userService.updateUserName(userName, id);
    if (!updatedUser) {
      const newUser = userService.createUser(userName, id);
      response.json(newUser);
    } else {
      response.json(updatedUser);
    }
  } catch (error) {
    next(error);
  }
};

export default { signup, signin };
