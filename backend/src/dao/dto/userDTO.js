import generateToken from "../../config/jwt/generateJWT.js";

export default class userDTO {
  constructor(user) {
    this._id = user._id;
    this.first_name = user.first_name;
    this.last_name = user.last_name;
    this.email = user.email;
    this.profile_picture = user.profile_picture;
    this.is_admin = user.is_admin;
    this.role = user.role;
    this.last_login = user.last_login;
    this.jwt = generateToken(user._id);
  }
}
