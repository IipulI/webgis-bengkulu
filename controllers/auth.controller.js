import {authService} from "../services/auth.service.js";
import ResponseBuilder from "../utils/response.js";

const handleLogin = async (req, res, next) => {
    try {
        const { username, password } = req.body;
        const result = await authService.login(username, password);

        new ResponseBuilder(res)
            .status('success')
            .message('Login successful')
            .json(result);

    } catch (error) {
        next(error);
    }
};

export const authController = {
    handleLogin,
}